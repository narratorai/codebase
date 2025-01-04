from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetQueryTemplates(BaseModel):
    query_templates: List["GetQueryTemplatesQueryTemplates"]


class GetQueryTemplatesQueryTemplates(BaseModel):
    id: Any
    data_source: str
    transformation_name: str
    transformation_kind: Optional[transformation_kinds_enum]
    transformation_update_type: Optional[transformation_update_types_enum]
    query: str
    schema_names: Optional[str]


GetQueryTemplates.update_forward_refs()
GetQueryTemplatesQueryTemplates.update_forward_refs()
