from typing import Any, List

from .base_model import BaseModel


class GetOptOutEmails(BaseModel):
    user: List["GetOptOutEmailsUser"]


class GetOptOutEmailsUser(BaseModel):
    email: str
    id: Any


GetOptOutEmails.update_forward_refs()
GetOptOutEmailsUser.update_forward_refs()
