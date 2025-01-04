from typing import List, Optional

from .base_model import BaseModel


class UpdateTransformationRunDepends(BaseModel):
    delete_transformation_run_after: Optional["UpdateTransformationRunDependsDeleteTransformationRunAfter"]
    delete_transformation_depends_on: Optional["UpdateTransformationRunDependsDeleteTransformationDependsOn"]
    insert_transformation_run_after: Optional["UpdateTransformationRunDependsInsertTransformationRunAfter"]
    insert_transformation_depends_on: Optional["UpdateTransformationRunDependsInsertTransformationDependsOn"]


class UpdateTransformationRunDependsDeleteTransformationRunAfter(BaseModel):
    returning: List["UpdateTransformationRunDependsDeleteTransformationRunAfterReturning"]


class UpdateTransformationRunDependsDeleteTransformationRunAfterReturning(BaseModel):
    id: int


class UpdateTransformationRunDependsDeleteTransformationDependsOn(BaseModel):
    returning: List["UpdateTransformationRunDependsDeleteTransformationDependsOnReturning"]


class UpdateTransformationRunDependsDeleteTransformationDependsOnReturning(BaseModel):
    id: int


class UpdateTransformationRunDependsInsertTransformationRunAfter(BaseModel):
    returning: List["UpdateTransformationRunDependsInsertTransformationRunAfterReturning"]


class UpdateTransformationRunDependsInsertTransformationRunAfterReturning(BaseModel):
    id: int


class UpdateTransformationRunDependsInsertTransformationDependsOn(BaseModel):
    returning: List["UpdateTransformationRunDependsInsertTransformationDependsOnReturning"]


class UpdateTransformationRunDependsInsertTransformationDependsOnReturning(BaseModel):
    id: int


UpdateTransformationRunDepends.update_forward_refs()
UpdateTransformationRunDependsDeleteTransformationRunAfter.update_forward_refs()
UpdateTransformationRunDependsDeleteTransformationRunAfterReturning.update_forward_refs()
UpdateTransformationRunDependsDeleteTransformationDependsOn.update_forward_refs()
UpdateTransformationRunDependsDeleteTransformationDependsOnReturning.update_forward_refs()
UpdateTransformationRunDependsInsertTransformationRunAfter.update_forward_refs()
UpdateTransformationRunDependsInsertTransformationRunAfterReturning.update_forward_refs()
UpdateTransformationRunDependsInsertTransformationDependsOn.update_forward_refs()
UpdateTransformationRunDependsInsertTransformationDependsOnReturning.update_forward_refs()
