from typing import Any, Optional

from .base_model import BaseModel


class CreateNewTransformation(BaseModel):
    transformation: Optional["CreateNewTransformationTransformation"]


class CreateNewTransformationTransformation(BaseModel):
    id: Any


CreateNewTransformation.update_forward_refs()
CreateNewTransformationTransformation.update_forward_refs()
