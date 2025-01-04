from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateTest(BaseModel):
    update_transformation_test: Optional["UpdateTestUpdateTransformationTest"]


class UpdateTestUpdateTransformationTest(BaseModel):
    returning: List["UpdateTestUpdateTransformationTestReturning"]


class UpdateTestUpdateTransformationTestReturning(BaseModel):
    id: Any


UpdateTest.update_forward_refs()
UpdateTestUpdateTransformationTest.update_forward_refs()
UpdateTestUpdateTransformationTestReturning.update_forward_refs()
