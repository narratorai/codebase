from dataclasses import dataclass
from typing import Generator

import openai
from pydantic import BaseModel

from core.models.company import CompanyTable
from core.v4.llm.models import LLMMessage, UIMessage
from core.v4.mavis import Mavis


@dataclass
class Tool:
    mavis: Mavis
    company_table: CompanyTable
    past_messages: list[LLMMessage]

    @property
    def model(self) -> BaseModel:
        return BaseModel

    @property
    def description(self) -> str:
        return ""

    @property
    def json_schema(self) -> dict:
        json_schema = openai.pydantic_function_tool(self.model)
        json_schema["description"] = self.description
        return self.apply_json_schema_extra(json_schema)

    def apply_json_schema_extra(self, json_schema: dict) -> dict:
        return json_schema

    @property
    def is_generator(self) -> bool:
        return False

    @property
    def when_to_use(self) -> str:
        return ""

    def run(self, model: BaseModel) -> Generator | UIMessage:
        pass
