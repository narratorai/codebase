from typing import Literal

from pydantic import Field

from core.models.ids import UUIDStr
from core.models.table import TableData
from core.models.warehouse_schema import TableSchema

from ..utils.pydantic import CamelModel, SearchParams


class QueryParams(SearchParams):
    schema_name: str | None = None
    table_name: str | None = None
    include_columns: bool = False


class Column(CamelModel):
    id: UUIDStr
    name: str
    label: str
    type: str
    dim_id: UUIDStr | None = None


class QueryResult(CamelModel):
    query: str
    result: TableData | None


class QueryInput(CamelModel):
    query: str


class EndpointAlert(CamelModel):
    is_all: bool = True
    tracked_schemas: list[str] = Field(default_factory=list)
    action: Literal["created", "deleted", "updated", "all"] = "all"


class TableAlert(EndpointAlert):
    user_id: UUIDStr


class SchemaList(CamelModel):
    schema_names: list[str]


class GetSchemaOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[TableSchema]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "123",
                            "schema_name": "shopify",
                            "table_name": "orders",
                            "description": "Orders from shopfy",
                            "total_rows": 23343,
                            "indexed_at": "2024-02-12T00:00",
                            "dim_id": "123",  # if the user has a dim
                            "columns": [
                                {"name": "order_id", "type": "string", "examples": None},
                                {"name": "customer_email", "type": "string", "examples": None},
                                {"name": "total_amount", "type": "number", "examples": None},
                                {"name": "order_date", "type": "timestamp", "examples": None},
                                {
                                    "name": "status",
                                    "type": "string",
                                    "examples": ["completed", "processing", "shipped"],
                                },
                            ],
                        }
                    ],
                }
            ]
        }


class SQLQueryFix(CamelModel):
    query: str
    error: str
    last_query: str | None = None


class SQLQueryGenerator(CamelModel):
    query: str | None = None
    prompt: str
    kind: Literal["any", "activity", "customer_dimension"] = "any"


class SQLQueryAutocomplete(CamelModel):
    before_cursor: str
    after_cursor: str
    tables: list[TableSchema]
    warehouse_language: str


class SQLQueryAutocompleteResponse(CamelModel):
    completion: str


class SQLComponentsResponse(CamelModel):
    warehouse_language: str
    tables: list[TableSchema]


class SQLQuery(CamelModel):
    query: str


class SQLQueryResponse(SQLQuery):
    explanation: str


class ConvertToDimInput(CamelModel):
    join_key: str
