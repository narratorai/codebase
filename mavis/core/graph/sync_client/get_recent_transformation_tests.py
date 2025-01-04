from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_test_status_enum


class GetRecentTransformationTests(BaseModel):
    tests: List["GetRecentTransformationTestsTests"]


class GetRecentTransformationTestsTests(BaseModel):
    name: str
    id: Any
    data: Optional[str]
    created_at: Any
    ran_data_from: Optional[Any]
    query: Optional[str]
    content: Optional[str]
    status: transformation_test_status_enum
    updated_at: Any


GetRecentTransformationTests.update_forward_refs()
GetRecentTransformationTestsTests.update_forward_refs()
