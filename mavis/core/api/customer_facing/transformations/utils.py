from core.api.customer_facing.tasks.utils import TaskManager
from core.api.customer_facing.utils.decorator import ensure_company, ensure_mavis
from core.constants import (
    AHMED_USER_ID,
    MV_TRANSFORMATION_PROCESS,
    NORMAL_TRANSFORMATION_PROCESS,
    TRANSFORMATION_FAILURE_EMAIL_TEMPLATE,
    TRANSFORMATION_RESYNC_EMAIL_TEMPLATE,
)
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import (
    company_task_category_enum,
    maintenance_kinds_enum,
    sql_query_kinds_enum,
    tag_relations_enum,
    transformation_kinds_enum,
    transformation_update_types_enum,
)
from core.graph.sync_client.insert_sql_query import InsertSqlQuery
from core.graph.sync_client.insert_transformation_maintenance import InsertTransformationMaintenance
from core.graph.sync_client.update_sql_query import UpdateSqlQueryUpdatedQuery
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.util.email import send_email
from core.utils import date_add, get_error_message, slugify, utcnow
from core.v4.blocks.transformation_tests import aysnc_run_single_test

from ..utils import BasicHandler, QueryBuilder, Updator
from .models import (
    CONFIG_MAPPINGS,
    KIND_MAPPING,
    UPDATE_MAPPING,
    CreateTransformationOutput,
    NewTask,
    ProcessingConfiguration,
    test_enum,
)

logger = get_logger()


class BasicTransformationHandler(BasicHandler):
    @property
    def index_name(self):
        return "transformation"

    @property
    def related_key(self):
        return tag_relations_enum.transformation.value

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            "user_id": {"type": "keyword"},
            # Fields Used for Search
            "slug": {"type": "keyword"},
            "name": {"type": "text"},
            "table": {"type": "text"},
            "sql": {"type": "text"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "pushed_to_production_by": {"type": "keyword"},
            "update_type": {"type": "keyword"},
            "activities": {"type": "text"},
            "task_id": {"type": "keyword"},
            "kind": {"type": "keyword"},
            "advanced_configs": {"type": "keyword"},
        }


class TransformationQueryBuilder(BasicTransformationHandler, QueryBuilder):
    @property
    def search_fields(self):
        return ["name^8", "*table^4", "activities^2", "*sql"]

    @property
    def filter_fields(self):
        return [
            "kind",
            "pushed_to_production_by",
            "update_type",
            "advanced_configs",
            "in_maintenance",
            "in_production",
            "task_id",
        ]

    @property
    def sort_by(self) -> list[tuple]:
        return [("updated_at", "desc")]

    def pre_process_filters(self):
        if self.filters.get("in_maintenance"):
            self.filters["ids"] = [
                r.transformation_id
                for r in graph_client.get_all_active_transformation_maintenance(
                    self.user.company_id
                ).transformation_maintenance
            ]
            self.filters.pop("in_maintenance")

        if self.filters.get("in_production"):
            self.filters["pushed_to_production_by"] = "not_null"
            self.filters.pop("in_production")

    def get_graph_data(self, ids):
        return [t.dict() for t in graph_client.get_transformations(ids=ids).transformation]

    def combine_search_and_graph_data(self, search_result: dict, graph_data: list[dict] | None):
        row = next((r for r in graph_data if r.get("id") == search_result["id"]), None)

        if row is None:
            return None

        advanced_configs = []

        # add all the advanced configs that are true
        for k, v in CONFIG_MAPPINGS.items():
            if row.get(k):
                advanced_configs.append(v)

        output = dict(
            id=row["id"],
            name=row["name"],
            slug=row["slug"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            table=row["table"],
            kind=KIND_MAPPING[row["kind"]],
            update_type=UPDATE_MAPPING[row["update_type"]],
            activities=[
                dict(
                    id=a["activity"]["id"],
                    name=a["activity"]["name"],
                )
                for a in row["activities"]
            ],
            awaiting_resync=row["next_resync_at"],
            alerts=row["transformation_maintenances"],
            advanced_configs=advanced_configs,
            task_id=row["company_task"]["id"],
            last_status=row["company_task"]["executions"][0]["status"]
            if row["company_task"] and row["company_task"]["executions"]
            else None,
            in_production=False,
            pushed_to_production_by=search_result.get("pushed_to_production_by"),
        )

        if row["production_queries"]:
            output["push_to_production_at"] = row["production_queries"][0]["updated_at"]
            output["in_production"] = True

        return output


class TransformationUpdator(BasicTransformationHandler, Updator):
    def get(self, id: UUIDStr):
        return graph_client.get_full_transformation(id=id).transformation

    def get_search_data(self, id: UUIDStr):
        row = self.get(id)
        advanced_configs = []

        # add all the advanced configs that are true
        for k, v in CONFIG_MAPPINGS.items():
            if getattr(row, k):
                advanced_configs.append(v)

        output = dict(
            id=row.id,
            name=row.name,
            slug=row.slug,
            table=row.table,
            user_id=row.updated_by,
            sql=row.current_query.sql if row.current_query is not None else "",
            kind=KIND_MAPPING[row.kind].value,
            update_type=UPDATE_MAPPING[row.update_type].value,
            updated_at=row.updated_at,
            activities=[a.activity.name for a in row.activities] + [a.activity.slug for a in row.activities],
            advanced_configs=advanced_configs,
            push_to_production_at="1900-01-01",
            pushed_to_production_by=None,
            task_id=row.task_id,
        )

        if row.production_queries:
            output["sql"] = row.production_queries[0].sql
            output["push_to_production_at"] = row.production_queries[0].updated_at

            if "@" in row.production_queries[0].updated_by:
                output["pushed_to_production_by"] = AHMED_USER_ID
            else:
                output["pushed_to_production_by"] = row.production_queries[0].updated_by

        return output


class TransformationManager(TransformationUpdator):
    @ensure_company
    def create(
        self,
        name: str,
        kind: transformation_kinds_enum,
        table_name: str | None = None,
        sql: str | None = None,
        notes: str | None = None,
    ):
        # autogenerate the table name based on the transformation name
        if table_name is None:
            table_name = name

        table_name = slugify(table_name)
        if kind != transformation_kinds_enum.stream and self.company.table(table_name) is not None:
            raise SilenceError(f"The table name {table_name} is already used as an Activity Stream")

        slug = slugify(name)
        # update
        if kind == transformation_kinds_enum.stream:
            task_id = self.company.get_task_id(NORMAL_TRANSFORMATION_PROCESS)
            update_type = transformation_update_types_enum.regular
        else:
            update_type = transformation_update_types_enum.materialized_view
            task_id = self.company.get_task_id(MV_TRANSFORMATION_PROCESS)

        # create with new slug
        for ii in range(10):
            try:
                transformation_id = graph_client.create_new_transformation(
                    company_id=self.company.id,
                    slug=slug,
                    name=name,
                    kind=kind,
                    table=table_name,
                    update_type=update_type,
                    task_id=task_id,
                    updated_by=self.user.id,
                ).transformation.id

                if sql is not None:
                    self._create_query(transformation_id, sql_query_kinds_enum.current, sql, notes)
                break
            except Exception as e:
                if "transformation_company_id_slug_key" in get_error_message(e):
                    slug = f"{slugify(name)}_{ii+1}"
                else:
                    raise e

        self.resync_id(transformation_id)
        return CreateTransformationOutput(
            id=transformation_id,
            slug=slug,
            task_id=task_id,
            update_type=update_type,
        )

    def update(
        self,
        id: UUIDStr,
        name: str,
        table_name: str | None = None,
        query_id: UUIDStr | None = None,
        sql: str | None = None,
        notes: str | None = None,
    ):
        graph_client.update_transformation_name(
            id=id,
            name=name,
            table=slugify(table_name),
            updated_by=self.user.id,
        )
        if sql:
            if query_id:
                self._update_query(query_id, sql, notes)
            else:
                self._create_query(id, sql_query_kinds_enum.current, sql, notes)

        table_name = slugify(table_name)
        self.update_search_data(id, dict(table=table_name, name=name))

    @ensure_mavis
    def delete(self, id: UUIDStr):
        from batch_jobs.data_management.run_transformations import delete_transformation_process

        delete_transformation_process(self.mavis, id)
        graph_client.delete_transformation(id=id)
        self.delete_id(id)

    @ensure_mavis
    def remove_from_production(self, id: UUIDStr):
        from batch_jobs.data_management.run_transformations import delete_transformation_process

        delete_transformation_process(self.mavis, id)
        graph_client.delete_all_queries(
            related_to="transformation",
            related_id=id,
            related_kind="production",
        )
        self.update_search_data(id, dict(push_to_production_at=None, pushed_to_production_by=None))
        # delete all the maintenance too
        self.end_maintenance(id)
        return None

    @ensure_company
    def update_config(self, id: UUIDStr, config: ProcessingConfiguration):
        if isinstance(config.task, NewTask):
            task_id = None
        else:
            task_id = config.task

        if config.max_days_to_insert and not (config.start_data_after or self.company.start_data_on):
            raise SilenceError("Cannot set an Incremental Days with out a Start Date")

        # update the graph object
        graph_client.update_transformation_config(
            transformation_id=id,
            update_type=config.update_type,
            has_source=config.uses_identity_resolution,
            is_aliasing=config.aliasing_customer,
            delete_window=config.delete_window,
            do_not_delete_on_resync=config.never_deletes_rows,
            allow_future_data=config.allow_future_data,
            start_data_after=config.start_data_after,
            max_days_to_insert=config.max_days_to_insert,
            mutable_day_window=config.mutable_day_window,
            remove_customers=config.delete_customers,
            notify_row_count_percent_change=config.notify_row_count_percent_change,
            do_not_update_on_percent_change=config.do_not_update_on_percent_change,
            task_id=task_id,
        )

        # create a new processing task
        if isinstance(config.task, NewTask):
            from batch_jobs.data_management.run_transformations import run_transformations

            task_id = (
                TaskManager(company=self.company)
                .create(
                    run_transformations,
                    config.task.schedule,
                    task_slug=slugify(config.task.label),
                    label=config.task.label,
                    category=company_task_category_enum.processing.value,
                    update_db_table="transformation",
                    update_db_id=id,
                    # we need to do this cause their is a unique key on the tasks table
                    task_fields=dict(
                        created_by=self.user.id,
                        create_at=utcnow(),
                    ),
                )
                .id
            )

        # update if it is a view
        if config.update_type == transformation_update_types_enum.view:
            self.trigger_resync(id, task_id=task_id)

        self.resync_id(id)
        return None

    def _create_query(
        self, transformation_id: UUIDStr, kind: sql_query_kinds_enum, sql: str, notes: str | None = None
    ) -> InsertSqlQuery:
        res = graph_client.insert_sql_query(
            related_to="transformation",
            related_id=transformation_id,
            related_kind=kind,
            sql=sql,
            notes=notes if notes is not None else "",
            updated_by=self.user.id,
        ).inserted_query
        return res

    def _update_query(self, query_id: UUIDStr, sql: str, notes: str = "") -> UpdateSqlQueryUpdatedQuery:
        res = graph_client.update_sql_query(
            id=query_id,
            sql=sql,
            notes=notes,
            updated_by=self.user.id,
        ).updated_query
        return res

    @ensure_company
    def trigger_resync(self, id: UUIDStr, task_id: UUIDStr | None = None):
        graph_client.update_next_resync(transformation_id=id, next_resync_at=utcnow())

        if task_id is not None and not self.company.batch_halt:
            from batch_jobs.data_management.run_transformations import run_transformations

            run_transformations.send(company_slug=self.company.slug, task_id=task_id)

    def push_to_production(self, id: UUIDStr, sql: str):
        self._create_query(id, sql_query_kinds_enum.production, sql)
        self.update_search_data(id, dict(push_to_production_at=utcnow(), pushed_to_production_by=self.user.id, sql=sql))

    def run_test(
        self, transformation_id: UUIDStr, test_slug: test_enum, validate_data_from: str, run_async: bool = True
    ):
        logger.debug("Running test", test_slug=test_slug)

        # update the table
        test = graph_client.insert_test(
            name=test_slug,
            transformation_id=transformation_id,
            validate_data_from=validate_data_from,
            updated_by=self.user.id,
        ).insert_transformation_test.returning[0]

        args = (
            self.user.company.slug,
            transformation_id,
            validate_data_from,
            test_slug,
            test.id,
            utcnow(),
            self.user.id,
        )
        if run_async:
            message = aysnc_run_single_test.send_with_options(args=args, delay=1)
            message_id = message.message_id
        else:
            aysnc_run_single_test(*args)
            message_id = None
        return test, message_id

    def get_transformation_maintenance(self, transformation_id: UUIDStr):
        return graph_client.get_active_transformation_maintenance(
            id=transformation_id,
            last_updated_at=date_add(utcnow(), "hour", -1),
        ).transformation_maintenance

    def add_activity(self, transformation_id: UUIDStr, activity_id: UUIDStr):
        graph_client.insert_transformation_activity(
            activity_id=activity_id,
            transformation_id=transformation_id,
        )
        self.resync_id(transformation_id)

    def update_maintenance(self, transformation_id: UUIDStr, maintenance_id: UUIDStr, notes: str):
        graph_client.update_transformation_maintenance_note(
            id=maintenance_id,
            notes=notes,
        )
        return None

    def end_maintenance(self, transformation_id: UUIDStr):
        graph_client.end_transformation_maintenance(transformation_id=transformation_id)
        return None

    @ensure_company
    def create_maintenance(
        self, transformation_id: UUIDStr, kind: maintenance_kinds_enum, notes: str, error: str | None, owner: str
    ) -> InsertTransformationMaintenance:
        trans = graph_client.insert_transformation_maintenance(
            transformation_id=transformation_id,
            kind=kind,
            notes=notes,
        ).insert_transformation_maintenance_one

        # notify the user
        if kind != kind.duplicated_id:
            send_email(
                self.company,
                [owner],
                (
                    TRANSFORMATION_RESYNC_EMAIL_TEMPLATE
                    if kind
                    in (
                        maintenance_kinds_enum.cascade_resynced,
                        maintenance_kinds_enum.resynced,
                    )
                    else TRANSFORMATION_FAILURE_EMAIL_TEMPLATE
                ),
                dict(
                    transformation_id=transformation_id,
                    transformation_name=trans.transformation.name,
                    notes=notes,
                    error=error,
                    table_name=trans.transformation.table,
                ),
                tag="maintenance_email",
            )
        return trans
