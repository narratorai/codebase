from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class GetReports(BaseModel):
    reports: List["GetReportsReports"]


class GetReportsReports(BaseModel):
    id: Any
    type: Optional[narrative_types_enum]
    updated_at: Any
    compiled_versions: List["GetReportsReportsCompiledVersions"]
    task_id: Optional[Any]


class GetReportsReportsCompiledVersions(BaseModel):
    id: Optional[Any]
    created_at: Optional[Any]
    s3_key: Optional[str]


GetReports.update_forward_refs()
GetReportsReports.update_forward_refs()
GetReportsReportsCompiledVersions.update_forward_refs()
