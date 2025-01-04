from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import activity_status_enum


class GetActivityTransformations(BaseModel):
    activity_transform: Optional["GetActivityTransformationsActivityTransform"]


class GetActivityTransformationsActivityTransform(BaseModel):
    column_renames: List["GetActivityTransformationsActivityTransformColumnRenames"]
    status: activity_status_enum
    transformations: List["GetActivityTransformationsActivityTransformTransformations"]
    id: Any
    slug: str
    name: Optional[str]
    description: Optional[str]


class GetActivityTransformationsActivityTransformColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]
    casting: Optional[str]


class GetActivityTransformationsActivityTransformTransformations(BaseModel):
    transformation: "GetActivityTransformationsActivityTransformTransformationsTransformation"


class GetActivityTransformationsActivityTransformTransformationsTransformation(BaseModel):
    id: Any
    column_renames: List["GetActivityTransformationsActivityTransformTransformationsTransformationColumnRenames"]


class GetActivityTransformationsActivityTransformTransformationsTransformationColumnRenames(BaseModel):
    type: Optional[str]
    label: Optional[str]
    name: Optional[str]
    casting: Optional[str]
    has_data: Optional[bool]


GetActivityTransformations.update_forward_refs()
GetActivityTransformationsActivityTransform.update_forward_refs()
GetActivityTransformationsActivityTransformColumnRenames.update_forward_refs()
GetActivityTransformationsActivityTransformTransformations.update_forward_refs()
GetActivityTransformationsActivityTransformTransformationsTransformation.update_forward_refs()
GetActivityTransformationsActivityTransformTransformationsTransformationColumnRenames.update_forward_refs()
