from pydantic import BaseModel

from batch_jobs.data_management.index_activity_dims import _distribute_values
from core.api.customer_facing.sql.models import TableAlert
from core.api.customer_facing.utils.query import BasicHandler, QueryBuilder
from core.api.customer_facing.utils.updator import ItemUpdator, Updator

# from core.constants import UPDATED_SCHEMA_FT_URL
from core.constants import (
    DUPLICATE_ACTIVITY_ID_EMAIL_TEMPLATE,
    DUPLICATION_RESOLVED_EMAIL_TEMPLATE,
    NEW_TABLE_ALERT_EMAIL_TEMPLATE,
)
from core.decorators.task import task
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import column_rename_relations_enum, maintenance_kinds_enum
from core.graph.sync_client.insert_activity_maintenance import InsertActivityMaintenance
from core.logger import get_logger
from core.models.ids import UUIDStr, is_valid_uuid
from core.models.table import ColumnTypeEnum
from core.models.warehouse_schema import TableSchema, WarehouseSchema
from core.util.email import send_email
from core.util.llm import ask_gpt
from core.util.opensearch import opensearch_client

# from core.util.tracking import fivetran_track
from core.utils import utcnow
from core.v4.mavis import initialize_mavis

from ..utils.decorator import ensure_company, ensure_mavis

logger = get_logger()

description_prompt = """
**GOAL**: summarize the table and its columns in 1 sentence that can be used for search.

### Good Descriptions
- Sales orders from shopify with products, taxes and revenue details.
- An event table with details about calls, sales, and marketing events.
"""


class DescriptionRequest(BaseModel):
    description: str


class BasicWarehouseHandler(BasicHandler):
    @property
    def related_key(self):
        return "warehouse"

    @property
    def index_name(self):
        return "warehouse"

    @property
    def use_semantic_search(self):
        return True

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            # permissions fields
            "team_ids": {"type": "keyword"},
            # Fields Used for Search
            "schema_name": {"type": "text"},
            "table_name": {"type": "text"},
            "description": {"type": "text"},
            "indexed_at": {"type": "date"},
            "total_rows": {"type": "integer"},
            "dim_id": {"type": "keyword"},
            "columns": {
                "type": "nested",
                "properties": {
                    "name": {"type": "keyword"},
                    "type": {"type": "keyword"},
                    "examples": {"type": "text"},
                },
            },
        }


class WarehouseQueryBuilder(BasicWarehouseHandler, QueryBuilder):
    @property
    def search_fields(self):
        return ["schema_name^8", "table_name^8", "description^2"]

    @property
    def nested_search_fields(self):
        return {
            "columns": [
                "name^4",
                "examples",
            ]
        }

    @property
    def filter_fields(self):
        return ["dim_id"]

    @property
    def sort_by(self) -> list[tuple]:
        return [("dim_id", "asc"), ("id", "asc")]

    @property
    def use_semantic_search(self) -> bool:
        return True


class WarehouseManager(BasicWarehouseHandler, Updator):
    @ensure_company
    def get_schema(self, include_columns: bool = True) -> WarehouseSchema:
        ignore_fields = ["columns"] if not include_columns else []
        _, results = WarehouseQueryBuilder(company=self.company, per_page=5000)._search(ignore_fields)
        return WarehouseSchema(tables=results, language=self.company.warehouse_language)

    def _id(self, table: TableSchema):
        if isinstance(table, str):
            name = table
        else:
            name = table.name
        return f"{self.user.company_slug}:{name}"

    def get_table(self, table_id: str) -> TableSchema | None:
        if is_valid_uuid(table_id):
            return self.get_table_by_dim(table_id)

        data = self.get_index_row(table_id)
        if data:
            return TableSchema(**data)
        return None

    def get_table_by_dim(self, dim_id: str) -> TableSchema | None:
        # Get the table from OpenSearch using the dim_id
        results = opensearch_client.search(
            index=self.index_name,
            body={"query": {"term": {"dim_id": dim_id}}},
            _source=list(self.index_properties.keys()),
        )
        # Check if we found a matching table
        if results["hits"]["total"]["value"] > 0:
            return TableSchema(**results["hits"]["hits"][0]["_source"])
        return None

    def create(self, table: TableSchema, async_index=True):
        logger.debug(f"Creating table {table.name}")

        if len(table.columns) > 500:
            logger.info(f"Skipping indexing for {table.name} because it has more than 500 columns")
            return None

        search_data = {
            "id": self._id(table),
            "company_slug": self.user.company_slug,
            "schema_name": table.schema_name,
            "table_name": table.table_name,
            "dim_id": table.dim_id,
            "indexed_at": "1900-01-01",
            "columns": [c.dict() for c in table.columns],
        }

        # check to see if the dim still exists
        if table.dim_id is not None:
            dim = graph_client.get_dim(table.dim_id).dim_table_by_pk
            if dim is None:
                table.dim_id = None
            else:
                search_data["description"] = dim.description
                search_data["team_ids"] = [t.team_id for t in dim.team_permissions]

        if table.dim_id is not None:
            graph_client.delete_columns(table.dim_id, column_rename_relations_enum.dim_table)

        # Index the data
        opensearch_client.update(
            index=self.index_name,
            id=search_data["id"],
            body={"doc": search_data, "doc_as_upsert": True},
        )
        # handle tracking new tables to the warehouse
        # fivetran_track(
        #     self.user,
        #     url=UPDATED_SCHEMA_FT_URL,
        #     data=dict(schema_name=table.schema_name, table_name=table.table_name, version=2),
        # )
        if table.dim_id is not None:
            self._create_columns(table)
            if async_index:
                self.trigger_indexing(search_data["id"])
            else:
                self.process_table(search_data["id"])

        return search_data["id"]

    @ensure_mavis
    def process_table(self, table_id: str):
        table = WarehouseManager(mavis=self.mavis).get_table(table_id)

        qm = self.mavis.qm

        # get the total rows
        qm_table = qm.Table(schema=table.schema_name, table=table.table_name)
        count_data = self.mavis.run_query(qm.get_count_query(qm_table).to_query(), within_minutes=None)
        total_rows = count_data.rows[0]["total_rows"]

        # Add the examples
        for col in table.columns:
            if col.type == ColumnTypeEnum.string or col.type is None:
                query = qm.Query()
                query.set_from(qm_table)

                qm_col = qm.Column(table_column=col.name, column_type=col.type)
                # Get the top 10 values
                values = _distribute_values(self.mavis, query, total_rows, qm_col)

                values = [v for v in values if "NULL" not in v["key"] and v.get("index_weight", 0) > 0.10]
                if len(values) > 0:
                    col.examples = [v["key"] for v in values]

        if table.description is None:
            table.description = ask_gpt(
                description_prompt,
                table.content,
                DescriptionRequest,
            ).description

        search_data = dict(
            id=table_id,
            indexed_at=utcnow(),
            total_rows=total_rows,
            description=table.description,
            columns=[c.dict() for c in table.columns],
        )
        # update the row
        self.update_search_data(table_id, search_data, True)

    def trigger_indexing(self, table_id: str):
        async_index_table.send(self.user.company_slug, table_id)

    def delete(self, table: TableSchema):
        self.delete_id(table.id)

    @ensure_company
    def get_subscriptions(self) -> list[TableAlert]:
        subs = self.company.s3.get_file(["warehouse", "subscriptions.json"])
        if subs is None:
            return []
        return [TableAlert(**s) for s in subs["alerts"]]

    def get_user_subscriptions(self, user_id: UUIDStr | None = None) -> TableAlert | None:
        subs = self.get_subscriptions()
        if user_id is None:
            user_id = self.user.id
        return next((a for a in subs if a.user_id == user_id), None)

    def update_subscription(self, alert: TableAlert):
        subs = self.get_subscriptions()
        subs = [s for s in subs if s.user_id != alert.user_id]
        subs.append(alert.dict())
        self.company.s3.upload_object(dict(alerts=subs), ["warehouse", "subscriptions.json"])
        return None

    @ensure_mavis
    def sync_schema(self, async_index=True):
        # Get the most up to date schema
        # get the current schema
        current_schema = WarehouseManager(mavis=self.mavis).get_schema()
        current_tables = {t.unique_id: t for t in current_schema.tables}

        # update the dim_id for all tables
        # TODO: add Team Permissions
        dims = graph_client.get_company_dims(self.company.id)
        # add the dim_id
        for t in current_schema.tables:
            for dim in dims.dim_tables:
                name = f"{dim.schema_}.{dim.table}"
                if t.name.lower().endswith(name.lower()) and t.dim_id != dim.id:
                    logger.debug(f"Updating dim_id for {t.name} to {dim.id}")
                    opensearch_client.update(
                        index=self.index_name,
                        id=t.id,
                        body={"doc": dict(dim_id=dim.id), "doc_as_upsert": True},
                    )
                    break
            else:
                if t.dim_id is not None:
                    logger.debug(f"Deleting dim_id for {t.name}")
                    opensearch_client.update(
                        index=self.index_name,
                        id=t.id,
                        body={"doc": dict(dim_id=None), "doc_as_upsert": True},
                    )

        new_schema = self.mavis.get_warehouse_schema()
        new_tables = {t.unique_id: t for t in new_schema.tables}
        alerts = {}
        # Delete tables that are no longer in new_schema
        for unique_id, current_table in current_tables.items():
            if unique_id not in new_tables:
                logger.debug(f"Deleting table {current_table.name} because it is no longer in the schema")
                self.delete(current_table)
                alerts[current_table.name] = (current_table, "deleted")

        for unique_id, new_table in new_tables.items():
            if unique_id not in current_tables:
                logger.debug(f"Creating table {new_table.name} because it is not in the current schema")
                # new table
                self.create(new_table, async_index=async_index)
                if alerts.get(new_table.name) is None:
                    alerts[new_table.name] = (new_table, "created")
                else:
                    alerts[new_table.name] = (new_table, "updated")

        # notify the users of changes
        if len(alerts) > 0:
            for alert in self.get_subscriptions():
                temp_alerts = [
                    dict(
                        schema_name=t.schema_name,
                        table_name=t.table_name,
                        change=action,
                    )
                    for t, action in alerts.values()
                    if (alert.is_all or t.schema_name in alert.tracked_schemas) and (alert.action in ("all", action))
                ]

                if not temp_alerts:
                    continue
                if user := graph_client.get_user(alert.user_id).user_by_pk:
                    # notify the users of changes
                    send_email(
                        self.company,
                        user.email,
                        NEW_TABLE_ALERT_EMAIL_TEMPLATE,
                        dict(data_changes=temp_alerts),
                        tag="table_alert",
                    )

    @ensure_mavis
    def convert_to_dim(self, table_id: str, join_key: str):
        table = WarehouseManager(mavis=self.mavis).get_table(table_id)
        if table.dim_id:
            return table.dim_id

        if table.table_name.lower().startswith("stg__"):
            raise SilenceError("You cannot use the convert to dim function on a Staging table")

        # if it is using the cschema and add it
        if table.schema_name.lower().split(".")[-1] == self.company.warehouse_schema:
            table.schema_name = self.company.warehouse_schema

        dim_id = graph_client.insert_dim_table(
            company_id=self.company.id,
            schema=table.schema_name,
            table=table.table_name,
            join_key=join_key.lower() if join_key else None,
        ).insert_dim_table_one.id

        table.dim_id = dim_id
        # update the dim_id in opensearch
        opensearch_client.update(
            index=self.index_name,
            id=table.id,
            body={"doc": dict(dim_id=dim_id), "doc_as_upsert": True},
        )

        self._create_columns(table)
        self.trigger_indexing(table.id)
        return dim_id

    def _create_columns(self, table: TableSchema):
        # resync the columns
        for c in table.columns:
            graph_client.create_new_column(
                related_to_id=table.dim_id,
                related_to="dim_table",
                has_data=True,
                name=c.name,
                type=c.type,
                label=c.name,
                casting=None,
            )


class DimUpdator(BasicWarehouseHandler, ItemUpdator):
    @property
    def related_key(self):
        return "dim"

    def delete(self, id: UUIDStr):
        graph_client.delete_dim(id)
        self.delete_id(id)

    def end_maintenance(self, dim_id: UUIDStr, owner_emails: list[str] | str | None = None):
        graph_client.end_dim_maintenance(dim_table_id=dim_id)
        dim = graph_client.get_dim(dim_id)
        if owner_emails:
            send_email(
                self.user.company,
                owner_emails,
                DUPLICATION_RESOLVED_EMAIL_TEMPLATE,
                dict(
                    name=f"{dim.schema_}.{dim.table} dimension",
                ),
                tag="maintenance_email",
            )
        return None

    @ensure_company
    def create_maintenance(
        self, dim_id: UUIDStr, kind: maintenance_kinds_enum, notes: str, error: str | None, email_override: list[str]
    ) -> InsertActivityMaintenance:
        activity_maintenance = graph_client.insert_activity_maintenance(
            dim_table_id=dim_id,
            kind=kind,
            notes=notes,
        ).insert_activity_maintenance_one

        dim = graph_client.get_dim(dim_id).dim_table_by_pk

        if kind == maintenance_kinds_enum.duplicated_id:
            # notify the user
            send_email(
                self.company,
                email_override,
                DUPLICATE_ACTIVITY_ID_EMAIL_TEMPLATE,
                dict(
                    activity_id=dim_id,
                    activity_name=f"{dim.schema_}.{dim.table}",
                    notes=notes,
                    error=error,
                    table_name=dim.table,
                ),
                tag="maintenance_email",
            )
        return activity_maintenance


@task(queue_name="run_query")
def async_index_table(company_slug, id):
    mavis = initialize_mavis(company_slug)
    WarehouseManager(mavis=mavis).process_table(id)
