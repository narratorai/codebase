from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_test_status_enum


class GetTransformationTests(BaseModel):
    tests: List["GetTransformationTestsTests"]


class GetTransformationTestsTests(BaseModel):
    name: str
    id: Any
    data: Optional[str]
    created_at: Any
    ran_data_from: Optional[Any]
    query: Optional[str]
    content: Optional[str]
    status: transformation_test_status_enum
    updated_at: Any


GetTransformationTests.update_forward_refs()
GetTransformationTestsTests.update_forward_refs()
