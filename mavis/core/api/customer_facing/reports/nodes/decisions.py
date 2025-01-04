from dataclasses import dataclass
from typing import Optional

from core.api.customer_facing.reports.models import DecisionNodeConfig, DecisionNodeOutput
from core.api.customer_facing.reports.nodes import ReportNode
from core.api.customer_facing.reports.prosmirror import (
    CalloutAttrs,
    CalloutNode,
    ParagraphNode,
    TextNode,
    markdown_to_prosmirror,
    obj_to_prosmirror,
)
from core.graph.sync_client.base_model import BaseModel
from core.models.table import human_format
from core.models.time import pretty_diff, utcnow
from core.util.llm import ask_gpt


class StringOutput(BaseModel):
    value: str | None
    reason: Optional[str] = None

    def content(self, **kwargs) -> str:
        if self.value is None:
            return "N/A"
        return self.value


class TextOnlyOutput(BaseModel):
    value: str | None

    def content(self, **kwargs) -> str:
        if self.value is None:
            return "N/A"
        return self.value


class NumberOutput(BaseModel):
    value: float | None
    reason: Optional[str] = None

    def content(self, **kwargs) -> str:
        return human_format(self.value, kwargs.get("output_format"), **kwargs)


class BooleanOutput(BaseModel):
    value: bool | None
    reason: Optional[str] = None

    def content(self, **kwargs) -> str:
        return str(self.value)


class StringListOutput(BaseModel):
    value: list[str | None]
    reason: Optional[str] = None

    def content(self, **kwargs) -> list[str]:
        if self.value is None:
            return "No date provided"
        return [f"{v or 'N/A'}" for v in self.value]


class NumberListOutput(BaseModel):
    value: list[float | None]
    reason: Optional[str] = None

    def content(self, **kwargs) -> list[str]:
        return [
            f"{human_format(v, kwargs.get('output_format'), kwargs.get('timezone'), kwargs.get('locale'), kwargs.get('currency')) if v is not None else 'N/A'}"
            for i, v in enumerate(self.value)
        ]


class TimestampOutput(BaseModel):
    value: str | None
    reason: Optional[str] = None

    def content(self, **kwargs) -> str:
        if self.value is None:
            return "No date provided"
        return f"{self.value} - {pretty_diff(self.value)}"


PROMPT = """
You are a helpful assistant that can interpret data and provide insights.

**Tool Usage:**
- If the user requires information from the internet use the `SearchInternet` tool.

Today's date is {today}.
"""


@dataclass
class DecisionNode(ReportNode):
    config: DecisionNodeConfig

    @property
    def output_model(self):
        return DecisionNodeOutput

    def _run(self) -> DecisionNodeOutput:
        if self.config.output.type == "boolean":
            obj = BooleanOutput
        elif self.config.output.type == "text":
            obj = TextOnlyOutput
        elif self.config.output.type == "group_value":
            obj = StringOutput
        elif self.config.output.type == "group_value_list":
            obj = StringListOutput
        elif self.config.output.type == "timestamp":
            obj = TimestampOutput
        elif self.config.output.type == "number":
            obj = NumberOutput
        elif self.config.output.type == "string_list":
            obj = StringListOutput
        elif self.config.output.type == "number_list":
            obj = NumberListOutput
        else:
            raise ValueError(f"Invalid output type: {self.config.output.type}")

        if len(self.config.input_data) > 0:
            input_data = []
            for f in self.config.input_data:
                ds = self.get_dataset(f.id)
                data = ds.run(f.tab.slug)
                input_data.extend(["----------", f"Data from {ds.model.name}", "", data.to_markdown(), ""])

            # add the prompt
            input_data.extend(
                [
                    "----------",
                    "Now given the data above, please provide an answer to the following question:",
                    self.config.prompt,
                ]
            )

            if self.config.output.type in ("group_value", "group_value_list"):
                input_data.extend(["", "**IMPORTANT** You MUST return EXACTLY a value from the data above."])
        else:
            input_data = [self.config.prompt]

        return_obj, _ = ask_gpt(
            PROMPT.format(today=utcnow()), "\n".join(input_data), obj, use_small_model=False, allow_search=True
        )
        has_title = self.config.title is not None
        if has_title:
            title_content = ParagraphNode(content=[TextNode(text=self.config.title)])
        else:
            title_content = ParagraphNode(content=[TextNode(text="AI Decision")])

        if self.config.output.type == "text":
            content = markdown_to_prosmirror(return_obj.value)
            if has_title:
                content = [title_content, content]
        else:
            content = obj_to_prosmirror(
                return_obj.content(
                    output_format=self.config.output.format,
                    currency=self.mavis.company.currency_used,
                    locale=self.mavis.company.locale,
                    timezone=self.mavis.company.timezone,
                )
            )
            # handle the adding the reason
            if content.type == "paragraph":
                content.content[0].text = f"{self.config.title}: {content.content[0].text}"
            else:
                content = [title_content, content]

            content = [content, markdown_to_prosmirror(return_obj.reason)]
        content = CalloutNode(
            attrs=CalloutAttrs(backgroundColor=self.config.output.color, icon="✨"),
            content=[content] if not isinstance(content, list) else content,
        )

        return DecisionNodeOutput(
            node_id=self.id, value=return_obj.value, content=content, applied_on=self.config.applied_on
        )

    def _impacts_datasets(self) -> list[tuple[str, str]]:
        ds = set()
        for f in self.config.applied_on or []:
            ds.set((f.dataset.id, f.tab.slug if f.tab is not None else None))
        return list(ds)

    def _get_datasets(self) -> list[tuple[str, str]]:
        if len(self.config.input_data or []) > 0:
            return [(f.id, f.tab.slug) for f in self.config.input_data]

        return []
