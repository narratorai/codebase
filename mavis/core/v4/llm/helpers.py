import os

from core.models.company import Company
from core.utils import safe_format, utcnow
from core.v4.llm.models import UIMessage


def load_prompt(company: Company, prompt_name: str, **kwargs):
    with open(f"{os.path.dirname(__file__)}/prompts/{prompt_name}.md", "r") as f:
        return safe_format(
            f.read(),
            dict(
                timezone=company.timezone,
                company_name=company.name,
                today=utcnow(),
                **kwargs,
            ),
        )


def ui_message_to_chat_message(prompt: str, messages: list[UIMessage]):
    output_messages = []
    output_messages.append(dict(role="system", content=prompt))
    for m in messages:
        if m.tool_request:
            output_messages.append(m.tool_request)
        else:
            output_messages.append(
                dict(
                    role=m.role.value,
                    content=m.data.content,
                    **({"tool_call_id": m.tool_call_id, "name": m.function_name} if m.tool_call_id else {}),
                )
            )
    return output_messages
