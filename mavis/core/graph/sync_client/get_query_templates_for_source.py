from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetQueryTemplatesForSource(BaseModel):
    query_template: List["GetQueryTemplatesForSourceQueryTemplate"]


class GetQueryTemplatesForSourceQueryTemplate(BaseModel):
    id: Any
    warehouse_language: str
    data_source: str
    transformation_name: str
    transformation_kind: Optional[transformation_kinds_enum]
    transformation_update_type: Optional[transformation_update_types_enum]
    updated_at: Any
    schema_names: Optional[str]
    query: str


GetQueryTemplatesForSource.update_forward_refs()
GetQueryTemplatesForSourceQueryTemplate.update_forward_refs()
