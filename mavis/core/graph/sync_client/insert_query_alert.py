from typing import Any, Optional

from .base_model import BaseModel


class InsertQueryAlert(BaseModel):
    insert_company_query_alert_one: Optional["InsertQueryAlertInsertCompanyQueryAlertOne"]


class InsertQueryAlertInsertCompanyQueryAlertOne(BaseModel):
    id: Any


InsertQueryAlert.update_forward_refs()
InsertQueryAlertInsertCompanyQueryAlertOne.update_forward_refs()
