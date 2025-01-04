from typing import Any, Optional

from .base_model import BaseModel
from .enums import company_query_alert_kinds_enum, sql_query_relations_enum


class GetAlert(BaseModel):
    company_query_alert_by_pk: Optional["GetAlertCompanyQueryAlertByPk"]


class GetAlertCompanyQueryAlertByPk(BaseModel):
    id: Any
    alert_kind: company_query_alert_kinds_enum
    email: Optional[str]
    sql_query: "GetAlertCompanyQueryAlertByPkSqlQuery"
    company_task: Optional["GetAlertCompanyQueryAlertByPkCompanyTask"]


class GetAlertCompanyQueryAlertByPkSqlQuery(BaseModel):
    sql: str
    related_id: Optional[Any]
    related_to: Optional[sql_query_relations_enum]
    notes: Optional[str]


class GetAlertCompanyQueryAlertByPkCompanyTask(BaseModel):
    task_slug: str


GetAlert.update_forward_refs()
GetAlertCompanyQueryAlertByPk.update_forward_refs()
GetAlertCompanyQueryAlertByPkSqlQuery.update_forward_refs()
GetAlertCompanyQueryAlertByPkCompanyTask.update_forward_refs()
