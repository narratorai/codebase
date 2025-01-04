from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel


class CustomerDim(CamelModel):
    id: UUIDStr
    schema_name: str | None
    table: str


class CompanyTable(CamelModel):
    id: UUIDStr
    updated_at: str
    identifier: str
    activity_stream: str
    schema_name: str | None
    row_count: int | None
    is_imported: bool | None
    maintainer_id: UUIDStr | None = None
    customer_dim: CustomerDim | None
    customer_dim_table_id: str | None
    manually_partition_activity: bool | None
    default_time_between: str | None
    team_ids: list[str] | None
    color: str


class GetTableOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[CompanyTable]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "updated_at": "2021-09-29T20:00:00Z",
                            "identifier": "Customer",
                            "activity_stream": "table_name",
                            "schema_name": "tablel_Schema",
                            "row_count": 100,
                            "is_imported": False,
                            "maintainer_id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "customer_dim": {
                                "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                "schema_name": "tablel_Schema",
                                "table": "Customer",
                            },
                            "manually_partition_activity": False,
                            "default_time_between": "day",
                            "team_ids": ["db0daaa9-e7bf-4e62-9c5e-392cb193036d"],
                        }
                    ],
                }
            ]
        }
