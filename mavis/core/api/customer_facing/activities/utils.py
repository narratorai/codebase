from pydantic import BaseModel

from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core.api.customer_facing.tables.utils import TableManager
from core.constants import (
    ALL_TEMPORAL_JOIN_TEMPLATES,
    DUPLICATE_ACTIVITY_ID_EMAIL_TEMPLATE,
    DUPLICATION_RESOLVED_EMAIL_TEMPLATE,
    FIRST_ANALYSIS_NARRATIVE_TEMPLATE,
    FIRST_CUSTOMER_TABLE,
    FIRST_DATASET_NARRATIVE_TEMPLATE,
)
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.create_new_activity import CreateNewActivityInsertActivityOne
from core.graph.sync_client.enums import maintenance_kinds_enum, tag_relations_enum
from core.graph.sync_client.get_activities_by_slugs import GetActivitiesBySlugsActivities
from core.graph.sync_client.get_full_activity import GetFullActivityActivityByPk
from core.graph.sync_client.insert_activity_maintenance import InsertActivityMaintenance
from core.logger import get_logger
from core.models.ids import UUIDStr, get_uuid
from core.models.time import minutes_ago
from core.util.email import send_email
from core.util.llm import ask_gpt
from core.utils import get_simple_type
from core.v4.dataset_comp.query.model import ActivityColumns

from ..utils import BasicHandler, ItemUpdator, QueryBuilder
from ..utils.decorator import ensure_company, ensure_mavis, require_admin
from ..utils.pydantic import TeamPermission
from .models import Column

logger = get_logger()

description_prompt = """
**GOAL**: Provide a description that a user looking for this activity would use to understand its purpose based on the name and SQL.

**CONTEXT**:
- Every Activity has the same structure with activity_id, ts, anonymous_customer_id, customer, revenue_impact, link, and a series of feature columns.
- Each activity represents a moment in time where a customer (can be anonymous or any entity) has performed an action.
- The feature columns are used to capture the details of the activity.


**INSTRUCTIONS**:
- Write a concise, 1 sentence description that adds context beyond what is visible from the activity name, columns, and data.
- Do not reference specific column names.
- Focus on highlighting any special filters, case statements, or complex logic that may not be immediately clear from the SQL.
- Write it for a layman's audience.

**Example**
INPUT:
- Name: Opportunity
- SQL: ```SELECT
    o._id AS activity_id,
    o._created AS ts,
    NULL AS anonymous_customer_id, -- used in identity resolution
    o.company_name || ' - ' || o.replace_id AS customer,
   'potential_replacement' AS activity, -- ex. 'viewed_page'
    o.company_name || ' - ' ||  o.id as feature_keep_software,
    o.company_name as feature_company_name,
    CASE
        WHEN o.replacement_frequency ilike 'occ%'
            then 'occasional'
        WHEN o.replacement_frequency = 'infrequent'
            then 'rare'
        WHEN o.replacement_frequency ilike 'frequent%'
            then 'frequent'
        WHEN o.replacement_frequency ilike 'rare%'
            then 'rare'
        ELSE 'occasional'
    END as feature_commonality,
    o.explanation as feature_explanation,

    NULL AS revenue_impact,
    NULL AS link

FROM (
    SELECT o.*, ROW_NUMBER() over (PARTITION by o.company_name, o.id, o.replace_id ORDER BY o._created desc) as rw
    FROM clearfind.replace_opportunity o
    where o.code_version = 5
) o
where rw = 1  and o.no_opportunity is NULL
```

OUTPUT:
`Captures most recent opportunity for replacing a software`

"""


class BaseActivityHandler(BasicHandler):
    @property
    def index_name(self):
        return "activity"

    @property
    def use_semantic_search(self):
        return True

    @property
    def related_key(self):
        return tag_relations_enum.activity.value

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            "team_ids": {"type": "keyword"},
            # Fields Used for sorting
            "favorited_by": {"type": "keyword"},
            "tag_ids": {"type": "keyword"},
            "created_at": {"type": "date"},
            # Fields Used for Search
            "slug": {"type": "keyword"},
            "name": {"type": "text"},
            "description": {"type": "text"},
            "table_id": {"type": "keyword"},
            "columns": {
                "type": "nested",
                "properties": {
                    "name": {"type": "keyword"},
                    "label": {"type": "text"},
                    "type": {"type": "keyword"},
                    "dim_id": {"type": "keyword"},
                    "examples": {"type": "text"},
                },
            },
        }


class GetActivity(BaseModel):
    id: str
    slug: str
    name: str
    description: str | None
    table_id: str


class DescriptionRequest(BaseModel):
    description: str


class ActivitiesQueryBuilder(BaseActivityHandler, QueryBuilder):
    def __init__(
        self,
        *,
        include_maintenance: bool = False,  # Add this parameter
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.include_maintenance = include_maintenance  # Store it as instance variable

    @property
    def search_fields(self):
        return ["name^8", "description^2"]

    @property
    def nested_search_fields(self):
        return {
            "columns": [
                "label^4",
                "examples",
            ]
        }

    @property
    def filter_fields(self):
        return ["table_id", "in_maintenance"]

    @property
    def sort_by(self) -> list[tuple]:
        return [("favorited_by", "desc"), ("created_at", "desc")]

    def pre_process_filters(self):
        if self.filters.get("in_maintenance"):
            self.filters["ids"] = [
                r.activity_id
                for r in graph_client.get_all_active_activity_maintenance(self.user.company_id).activity_maintenance
            ]
            self.filters.pop("in_maintenance")

    def get_graph_data(self, ids: list[UUIDStr]) -> list[dict] | None:
        if not self.include_maintenance:
            return None

        rows = graph_client.get_active_maintenance(ids=ids, last_updated_at=minutes_ago(30)).activity_maintenance
        return [r.dict() for r in rows]

    def combine_search_and_graph_data(self, search_result: dict, graph_data: list[dict] | None):
        if graph_data is None:
            return search_result

        activity_maintenance = [g for g in graph_data if g.get("activity_id") == search_result["id"]]

        if len(activity_maintenance) > 0:
            if activity_maintenance[0]["ended_at"] is None:
                search_result["alert"] = activity_maintenance[0]
            else:
                search_result["ended_alert"] = activity_maintenance[0]

        return search_result


class ActivityUpdator(BaseActivityHandler, ItemUpdator):
    def get(self, id: UUIDStr) -> GetFullActivityActivityByPk:
        ac = graph_client.get_full_activity(id=id).activity_by_pk
        self.check_company(ac)
        return ac

    @ensure_company
    def check_dependent_permission(self, id: UUIDStr, permissions: TeamPermission):
        activity = self.get(id)
        if activity:
            # check the table permissions
            if not set(self.company.table(activity.table_id, raise_error=True).team_ids) & set(
                [t.team_id for t in activity.team_permissions],
            ):
                raise SilenceError(
                    "The Table permissions associated with the activity must encompass the permissions you are trying to share with."
                )

    @ensure_company
    def get_index_data(self, id: str):
        return self.company.s3.get_file(["indexes", "activity", f"{id}.json"], cache=True)

    @ensure_company
    def get_column_values(self, id: str):
        activity_columns = self.get_index_data(id)
        if not activity_columns:
            return {}
        else:
            return {c["name"]: c["values"] for c in activity_columns["columns"]}

    def get_search_data(self, id: UUIDStr):
        activity = self.get(id)
        output_row = dict(
            **activity.dict(),
            columns=[c.dict() for c in get_activity_columns(activity)],
        )
        column_values = self.get_column_values(id)
        # add the examples to the column values
        for col in output_row["columns"]:
            if col["type"] == "string" and col["name"] in column_values.keys():
                col_values = column_values[col["name"]]
                col_values = [v for v in col_values if "NULL" not in v["key"] and v.get("index_weight", 0) > 0.10]
                # only include the example if they are above 10% and not null
                if len(col_values) > 0:
                    col["examples"] = [cv["key"] for cv in col_values]

        # TODO: Remove this when we support teams
        self._backfill_shared(id, output_row)
        return output_row

    def vectorize(self, row: dict):
        return f'{row["name"]}: {row["description"]}' if row["description"] else row["name"]


class ActivityManager(ActivityUpdator):
    @require_admin
    def create(
        self,
        slug: str | None = None,
        name: str | None = None,
        description: str | None = None,
        table_id: str | None = None,
        table_name: str | None = None,
        transformation_id: str | None = None,
    ) -> GetActivitiesBySlugsActivities | CreateNewActivityInsertActivityOne:
        count = None

        #  Create the table if needed
        if table_id is None and table_name is not None:
            company_table = self.company.table(table_name)

            if company_table is None:
                try:
                    company_table = TableManager(mavis=self.mavis).create(
                        activity_stream=table_name,
                        identifier=table_name.split("_")[0] if table_name.split("_")[0] != "activity" else "Customer",
                        default_time_between="day",
                        is_imported=False,
                        manually_partition_activity=True,
                        maintainer_id=self.user.id,
                    )
                except Exception:
                    company_table = TableManager(mavis=self.mavis).create(
                        activity_stream=table_name,
                        identifier=f"customer_{get_uuid()[:4]}",
                        default_time_between="day",
                        is_imported=False,
                        manually_partition_activity=True,
                        maintainer_id=self.user.id,
                    )

            table_id = company_table.id

        # Handle the activities that already exists
        existing_activities = graph_client.get_activities_by_slugs(table_id, [slug]).activities
        if len(existing_activities) > 0:
            if transformation_id:
                # Insert the mapping to the transformation
                graph_client.insert_transformation_activity(
                    transformation_id=transformation_id, activity_id=existing_activities[0].id
                )
            self.update_activity_columns(existing_activities[0].id)
            return existing_activities[0]

        # update the name
        if name is None:
            name = slug.replace("_", " ").title()

        if description is None and transformation_id is not None:
            description = ask_gpt(
                description_prompt,
                f"Name: {name}\nSQL: ```\n{graph_client.get_transformation_simple(id=transformation_id).transformation.current_query.sql}```",
                DescriptionRequest,
            ).description

        activity_obj = graph_client.create_new_activity(
            company_id=self.user.company.id,
            slug=slug,
            name=name,
            description=description,
            table_id=table_id,
            updated_by=self.user.id,
            maintainer_id=self.user.id,
        ).insert_activity_one

        if transformation_id:
            # Insert the mapping to the transformation
            graph_client.insert_transformation_activity(
                transformation_id=transformation_id, activity_id=activity_obj.id
            )

        # Update the columns
        self.update_activity_columns(activity_obj.id)

        self.resync_id(activity_obj.id)
        self.trigger_index(activity_obj.id)
        # apply the post creation code
        self.apply_post_creation_code(activity_obj.id, table_id, count)
        return activity_obj

    def apply_post_creation_code(self, activity_id: str, table_id: str, count: int | None):
        if count is None:
            count = graph_client.get_activity_count(table_id=table_id).activity_aggregate.aggregate.count

        # don't bother if no activities are needed
        if count > 3:
            return None

        tasks = CustomTask(self.mavis.company.s3, TaskKindEnum.run_transformation)
        if count == 1:
            tasks.add_task(
                "run_narrative_template",
                template_name=FIRST_DATASET_NARRATIVE_TEMPLATE,
                activity_id=activity_id,
            )
            tasks.add_task(
                "run_narrative_template",
                template_name=FIRST_ANALYSIS_NARRATIVE_TEMPLATE,
            )
        elif count == 2:
            # add all the temporal joins
            for tem in ALL_TEMPORAL_JOIN_TEMPLATES:
                tasks.add_task(
                    "run_narrative_template",
                    template_name=tem,
                    skip_email=True,
                    activity_id=activity_id,
                    require_datasets=True,
                )

            # add the task to let everyone know
            tasks.add_task("email_about_templates")
        elif count == 3:
            # add the customer table
            tasks.add_task(
                "run_narrative_template",
                template_name=FIRST_CUSTOMER_TABLE,
            )

        tasks.update()

        return None

    def update_activity_columns(self, activity_id: str):
        # get and process the activities
        act = graph_client.get_activity_transformations(id=activity_id).activity_transform

        activity_columns = dict()
        current_cols = {c.name: c for c in act.column_renames}

        for t in act.transformations:
            for c in t.transformation.column_renames:
                col = dict(
                    related_to_id=activity_id,
                    related_to="activity",
                    has_data=c.has_data,
                    name=c.name,
                    type=c.type if c.name.startswith("feature") else (c.casting or c.type),
                    casting=c.casting if c.name.startswith("feature") else None,
                    label=c.label,
                )

                # use the old activity name
                if current_cols.get(col["name"]):
                    col["label"] = current_cols[c.name].label

                # Add it
                if not activity_columns.get(col["name"]):
                    activity_columns[col["name"]] = col

        # add the other columns
        for k, t in [
            (ActivityColumns.activity_occurrence, "integer"),
            (ActivityColumns.activity_repeated_at, "timestamp"),
        ]:
            activity_columns[k] = dict(
                related_to_id=activity_id,
                related_to="activity",
                has_data=True,
                name=k,
                type=t,
                label=current_cols[k].label if current_cols.get(k) else k.replace("_", " ").title(),
            )

        # delete and insert columns
        graph_client.delete_columns(id=activity_id, related_to="activity")
        for ac in activity_columns.values():
            graph_client.create_new_column(**ac)

        return activity_columns

    @ensure_mavis
    def delete(self, id: str):
        try:
            res = graph_client.delete_activity(id=id)
            self.delete_id(id)
        except Exception as e:
            raise e

        #  Delete the index data
        self.company.s3.delete_file(["indexes", "activity", f"{id}.json"])
        table_id = res.delete_activity_by_pk.table_id
        company_table = self.company.table(table_id)

        if company_table:
            count = graph_client.get_activity_count(table_id=table_id).activity_aggregate.aggregate.count

            if company_table.manually_partition_activity:
                query = self.mavis.qm.get_drop_table_query(
                    self.mavis.qm.stream_table(company_table, activity=res.delete_activity_by_pk.slug)
                )
                try:
                    self.mavis.run_query(query)
                except Exception as e:
                    logger.error("Failed to drop the table", error=str(e))

                # delete the table
                if count == 0:
                    TableManager(mavis=self.mavis).delete(table_id)

            else:
                # drop the activity table
                if count == 0:
                    TableManager(mavis=self.mavis).delete(table_id)
                else:
                    try:
                        # delete the tdata from the table
                        self.mavis.run_query(
                            self.mavis.qm.get_delete_query(
                                company_table.activity_stream,
                                self.mavis.qm.Condition(
                                    operator="equal",
                                    left=self.mavis.qm.Column(table_column=ActivityColumns.activity),
                                    right=self.mavis.qm.Column(value=res.delete_activity_by_pk.slug),
                                ),
                            )
                        )
                    except Exception as e:
                        logger.error("Failed to delete the table data", error=str(e))

    def trigger_index(self, id: str):
        # index the dims
        from batch_jobs.data_management.index_activity_dims import index_activity_dims

        index_activity_dims.send(company_slug=self.user.company.slug, activity_id=id)

    # Managing all the updates
    @ensure_company
    def update_index_data(self, id: str, config: dict):
        self.company.s3.upload_object(config, ["indexes", "activity", f"{id}.json"])
        self.resync_id(id)

    def end_maintenance(
        self, activity_id: UUIDStr, owner_emails: list[str] | str | None = None, skip_email: bool = False
    ):
        data = graph_client.end_activity_maintenance(activity_id=activity_id)
        # if no maintenance then no email
        if data.update_activity_maintenance.affected_rows == 0:
            return None
        if not skip_email:
            activity = graph_client.get_activity_simple(activity_id).activity_by_pk
            if owner_emails:
                send_email(
                    self.user.company,
                    owner_emails,
                    DUPLICATION_RESOLVED_EMAIL_TEMPLATE,
                    dict(
                        name=f"{activity.name} activity",
                    ),
                    tag="maintenance_email",
                )
        return None

    @ensure_company
    def create_maintenance(
        self,
        activity_id: UUIDStr,
        kind: maintenance_kinds_enum,
        notes: str,
        error: str | None,
        email_override: list[str],
    ) -> InsertActivityMaintenance:
        activity_maintenance = graph_client.insert_activity_maintenance(
            activity_id=activity_id,
            dim_table_id=None,
            kind=kind,
            notes=notes,
        ).insert_activity_maintenance_one

        if kind == maintenance_kinds_enum.duplicated_id:
            # notify the user
            send_email(
                self.company,
                email_override,
                DUPLICATE_ACTIVITY_ID_EMAIL_TEMPLATE,
                dict(
                    activity_id=activity_id,
                    activity_name=activity_maintenance.activity.name,
                    notes=notes,
                    error=error,
                    table_name=self.company.table(activity_maintenance.activity.table_id).activity_stream,
                ),
                tag="maintenance_email",
            )
        return activity_maintenance


def get_activity_columns(activity: GetFullActivityActivityByPk):
    columns = [
        Column(
            id=column.id,
            name=column.name,
            label=column.label,
            type=get_simple_type(column.type),
        )
        for column in activity.column_renames
        if column.name.startswith("feature") or column.has_data
    ]

    for dim in activity.activity_dims:
        columns.extend(
            Column(
                id=column.id,
                name=column.name,
                label=column.label,
                type=get_simple_type(column.type),
                dim_id=dim.dim_table.id,
            )
            for column in dim.dim_table.columns
        )

    return columns
