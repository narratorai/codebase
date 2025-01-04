from typing import Any, List, Optional

from .base_model import BaseModel


class GetAllCustomFunctions(BaseModel):
    custom_function: List["GetAllCustomFunctionsCustomFunction"]


class GetAllCustomFunctionsCustomFunction(BaseModel):
    id: Any
    input_count: int
    name: str
    text_to_replace: str
    description: Optional[str]


GetAllCustomFunctions.update_forward_refs()
GetAllCustomFunctionsCustomFunction.update_forward_refs()
