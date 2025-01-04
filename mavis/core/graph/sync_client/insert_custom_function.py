from typing import Any, Optional

from .base_model import BaseModel


class InsertCustomFunction(BaseModel):
    insert_custom_function_one: Optional["InsertCustomFunctionInsertCustomFunctionOne"]


class InsertCustomFunctionInsertCustomFunctionOne(BaseModel):
    id: Any


InsertCustomFunction.update_forward_refs()
InsertCustomFunctionInsertCustomFunctionOne.update_forward_refs()
