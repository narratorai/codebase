from pydantic import BaseModel, Field


class ActivityResult(BaseModel):
    data_schema: dict | list = Field(..., alias="schema")
    ui_schema: dict
    data: dict | list
    internal_cache: dict
    block_slug: str
