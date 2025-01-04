from core.models.ids import UUIDStr
from core.models.table import _external_dict
from core.v4.llm.models import UIMessage

from ..utils.pydantic import CamelModel, FilterParamWithUser, OutputModelNoName


class QueryParams(FilterParamWithUser):
    table_id: UUIDStr | None = None


class ChatRow(OutputModelNoName):
    table_id: UUIDStr
    summary: str
    detailed_summary: str | None


class MessageHistory(CamelModel):
    id: str
    table_id: str
    user_id: str
    messages: list[UIMessage]
    created_at: str | None = None
    created_by: str | None = None

    def external_dict(self, **kwargs):
        return _external_dict(self)


class CreateChatOutput(MessageHistory):
    id: str


class VoteInput(CamelModel):
    rating: int = 0


class ChatRequestInput(CamelModel):
    request_type: str
    context: str
    message_id: str | None = None


class ChatRequestOutput(CamelModel):
    request_id: str


class ChatSummary(CamelModel):
    summary: str
    detailed_summary: str


class GetChatOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[ChatRow]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 10,
                    "data": [
                        {
                            "id": "3b0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "tableId": "b1a85e15-6f5a-4f2b-8d50-96fcebb0e3f9",
                            "summary": "This is the summary of the chat",
                            "detailedSummary": "This is the detailed summary of the chat",
                            "favorited": False,
                            "totalFavorites": 0,
                            "teamIds": [],
                            "tagIds": [],
                            "sharedWithEveryone": False,
                            "createdAt": "2023-05-27T18:28:18.000000+00:00",
                            "createdBy": "3b0daaa9-e7bf-4e62-9c5e-392cb193036d",
                        }
                    ],
                }
            ]
        }


class CreateChatInput(CamelModel):
    content: str
    table_id: UUIDStr


class ChatSuggestions(CamelModel):
    total_count: int
    data: list[str]
