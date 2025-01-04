from typing import Any, List, Optional

from .base_model import BaseModel


class GetCompanyDims(BaseModel):
    dim_tables: List["GetCompanyDimsDimTables"]


class GetCompanyDimsDimTables(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]


GetCompanyDims.update_forward_refs()
GetCompanyDimsDimTables.update_forward_refs()
