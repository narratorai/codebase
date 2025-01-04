from typing import Any, Optional

from .base_model import BaseModel


class UpdateUserAvatar(BaseModel):
    insert_company_user_preferences_one: Optional["UpdateUserAvatarInsertCompanyUserPreferencesOne"]


class UpdateUserAvatarInsertCompanyUserPreferencesOne(BaseModel):
    id: Any


UpdateUserAvatar.update_forward_refs()
UpdateUserAvatarInsertCompanyUserPreferencesOne.update_forward_refs()
