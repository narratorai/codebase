from typing import Any, List, Optional

from .base_model import BaseModel


class GetCompanyUserId(BaseModel):
    company_user: List["GetCompanyUserIdCompanyUser"]


class GetCompanyUserIdCompanyUser(BaseModel):
    id: Any
    user_id: Any
    first_name: Optional[str]
    last_name: Optional[str]
    job_title: Optional[str]
    created_at: Any
    updated_at: Any


GetCompanyUserId.update_forward_refs()
GetCompanyUserIdCompanyUser.update_forward_refs()
