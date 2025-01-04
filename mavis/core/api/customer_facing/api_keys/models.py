from datetime import datetime

from pydantic import BaseModel, Field

from core.models.ids import UUIDStr


class UserOutput(BaseModel):
    id: str = Field(description="The ID of the user")
    email: str = Field(description="The email of the user")


class APIKeyBase(BaseModel):
    id: str = Field(description="The ID of the key")
    label: str = Field(description="The label of the API key")
    user: UserOutput = Field(description="The user that this API key impersonates")
    created_at: datetime


class CreateKeyOutput(APIKeyBase):
    api_key: str = Field(description="The API key")


class ActiveAPIKey(APIKeyBase):
    pass


class UserInput(BaseModel):
    id: UUIDStr = Field(description="The ID of the user")


class CreateKeyInput(BaseModel):
    label: str | None = Field(description="The label of the API key")
    user: UserInput = Field(description="The user that this API key impersonates")
    ttl: int | None = Field(description="The time to live of the API key in seconds")
