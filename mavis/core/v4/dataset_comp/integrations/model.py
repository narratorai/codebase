from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from core.models.ids import UUIDStr


class MaterializationTypeEnum(StrEnum):
    gsheets = "gsheets"
    csv = "csv"
    text = "text"
    alert = "alert"
    webhook = "webhook"
    view = "view"
    postmark = "postmark"
    klaviyo = "klaviyo"
    materialized_view = "materialized_view"

    # FOR custom ones
    finserve_income_tracking = "finserv_income_tracking"
    clearfind_loader = "clearfind_loader"
    clearfind_refine = "clearfind_refine"
    clearfind_overlap = "clearfind_overlap"
    clearfind_evaluate_software = "clearfind_evaluate_software"
    clearfind_email_replier = "clearfind_email_replier"


class GsheetDetails(BaseModel):
    sheet_key: str


class MaterializedViewDetails(BaseModel):
    days_to_resync: int = 30
    column_id: str | None


class TextDetails(BaseModel):
    user_ids: list[str]


class CSVDetails(BaseModel):
    user_ids: list[str]
    format: Literal["csv", "xls"] = "csv"


class LoginTokenAuth(BaseModel):
    url: str
    body: dict
    token_key: str


class UserAuth(BaseModel):
    user: str
    password: str


class BearerTokenAuth(BaseModel):
    token: str


class APIKeyAuth(BaseModel):
    api_key: str


class WebhookPostDetails(BaseModel):
    url: str
    auth: UserAuth | LoginTokenAuth | BearerTokenAuth | APIKeyAuth | None
    headers: dict = Field(default_factory=dict)
    row_mapping: dict | None


class WebhookDetails(BaseModel):
    webhook: WebhookPostDetails
    on_success: WebhookPostDetails | None
    on_failure: WebhookPostDetails | None

    # handle the breakdown
    max_retry: int = 2
    rows_per_post: int = 500


class ViewMaterializationDetails(BaseModel):
    pass


class PostMarkDetails(BaseModel):
    api_key: str
    template_id: str
    from_email: str
    column_id: str
    success_webhook: WebhookDetails | None


class klaviyoDetails(BaseModel):
    api_key: str
    url: str
    max_retry: int = 2


class AlertDetails(BaseModel):
    return_rows: bool
    email: str


class MetricConditionDetails(BaseModel):
    metric_column_id: str
    value: float
    email: str
    delete_after_notification: bool = True


AnyDetail = (
    WebhookDetails
    | GsheetDetails
    | PostMarkDetails
    | CSVDetails
    | klaviyoDetails
    | MaterializedViewDetails
    | MetricConditionDetails
    | AlertDetails
    | TextDetails
    | ViewMaterializationDetails
)


class Materialization(BaseModel):
    id: str | None = None
    label: str
    type: MaterializationTypeEnum
    dataset_id: UUIDStr
    tab_slug: str | None
    ai_prompt: str | None = None
    allow_internet_search: bool = False
    version: int = 2
    details: AnyDetail | None = None
    task_id: str | None = None
    task_schedule: str | None = None


class MaterializationCreate(Materialization):
    cron: str
    hidden: bool = False


class MaterializationGet(Materialization):
    id: str
    task_id: str
    external_link: str | None
