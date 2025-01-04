from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum


class GetAllMaterializations(BaseModel):
    materializations: List["GetAllMaterializationsMaterializations"]


class GetAllMaterializationsMaterializations(BaseModel):
    id: Any
    group_slug: Optional[str]
    label: str
    type: materialization_type_enum
    task_id: Optional[Any]
    dataset_id: Any


GetAllMaterializations.update_forward_refs()
GetAllMaterializationsMaterializations.update_forward_refs()
