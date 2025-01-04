from typing import List, Optional

from .base_model import BaseModel


class GetTaskWatchers(BaseModel):
    watcher: List["GetTaskWatchersWatcher"]


class GetTaskWatchersWatcher(BaseModel):
    user: "GetTaskWatchersWatcherUser"


class GetTaskWatchersWatcherUser(BaseModel):
    email: str
    company_users: List["GetTaskWatchersWatcherUserCompanyUsers"]


class GetTaskWatchersWatcherUserCompanyUsers(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]


GetTaskWatchers.update_forward_refs()
GetTaskWatchersWatcher.update_forward_refs()
GetTaskWatchersWatcherUser.update_forward_refs()
GetTaskWatchersWatcherUserCompanyUsers.update_forward_refs()
