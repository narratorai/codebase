from typing import Any, List, Optional

from .base_model import BaseModel


class InsertTest(BaseModel):
    insert_transformation_test: Optional["InsertTestInsertTransformationTest"]


class InsertTestInsertTransformationTest(BaseModel):
    returning: List["InsertTestInsertTransformationTestReturning"]


class InsertTestInsertTransformationTestReturning(BaseModel):
    id: Any


InsertTest.update_forward_refs()
InsertTestInsertTransformationTest.update_forward_refs()
InsertTestInsertTransformationTestReturning.update_forward_refs()
