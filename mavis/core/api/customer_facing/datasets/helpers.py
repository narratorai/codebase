from core.v4.dataset_comp.integrations.model import (
    AlertDetails,
    AnyDetail,
    APIKeyAuth,
    BearerTokenAuth,
    CSVDetails,
    GsheetDetails,
    LoginTokenAuth,
    MaterializationTypeEnum,
    MaterializedViewDetails,
    MetricConditionDetails,
    PostMarkDetails,
    TextDetails,
    UserAuth,
    ViewMaterializationDetails,
    WebhookDetails,
    WebhookPostDetails,
    klaviyoDetails,
)


def parse_webhook_post_details(details: dict) -> WebhookPostDetails | None:
    if not details:
        return None

    auth = None
    if "auth_user" in details and "auth_password" in details:
        auth = UserAuth(user=details["auth_user"], password=details["auth_password"])
    elif "token" in details:
        auth = BearerTokenAuth(token=details["token"])
    elif "api_key" in details:
        auth = APIKeyAuth(api_key=details["api_key"])
    elif "session_token" in details:
        auth = LoginTokenAuth(**details["session_token"])
    return WebhookPostDetails(
        url=details["webhook_url"],
        auth=auth,
        headers={v["key"]: v["value"] for v in details.get("custom_headers", [])},
        row_mapping=details.get("row_mapping"),
    )


def _fix_list(k):
    if not isinstance(k, list):
        return [k]
    return k


def parse_details(mat_type: MaterializationTypeEnum, mat_atts: dict) -> AnyDetail:
    if mat_type == MaterializationTypeEnum.gsheets:
        return GsheetDetails(sheet_key=mat_atts["sheet_key"])

    elif mat_type == MaterializationTypeEnum.materialized_view:
        return MaterializedViewDetails(
            days_to_resync=mat_atts.get("days_to_resync", 30),
            column_id=mat_atts.get("column_id"),
        )

    elif mat_type == MaterializationTypeEnum.text:
        return TextDetails(user_ids=_fix_list(mat_atts["user_ids"]))

    elif mat_type == MaterializationTypeEnum.csv:
        return CSVDetails(user_ids=_fix_list(mat_atts["user_ids"]))

    elif mat_type == MaterializationTypeEnum.webhook:
        mat_atts["webhook"]["webhook_url"] = mat_atts["webhook_url"]
        return WebhookDetails(
            webhook=parse_webhook_post_details(mat_atts["webhook"]),
            on_success=parse_webhook_post_details(mat_atts.get("on_success")),
            on_failure=parse_webhook_post_details(mat_atts.get("on_failure")),
            max_retry=mat_atts["webhook"].get("max_retry", 2),
            rows_per_post=mat_atts["webhook"].get("rows_per_post", 500),
        )

    elif mat_type == MaterializationTypeEnum.view:
        return ViewMaterializationDetails()

    elif mat_type == MaterializationTypeEnum.postmark:
        return PostMarkDetails(
            api_key=mat_atts["api_key"],
            template_id=mat_atts["template_id"],
            from_email=mat_atts["postmark_from"],
            column_id=mat_atts["column_id"],
        )

    elif mat_type == MaterializationTypeEnum.klaviyo:
        return klaviyoDetails(
            api_key=mat_atts["api_key"],
            url=mat_atts["webhook_url"],
            max_retry=mat_atts.get("max_retry", 2),
        )

    elif mat_type == MaterializationTypeEnum.alert:
        if "metric_column_id" in mat_atts:
            return MetricConditionDetails(
                metric_column_id=mat_atts["metric_column_id"],
                value=mat_atts["value"],
                email=mat_atts["email"],
                delete_after_notification=mat_atts.get("delete_after_notification", True),
            )
        else:
            return AlertDetails(return_rows=mat_atts["return_rows"], email=mat_atts["email"])

    # this is used to represent CUSTOM
    else:
        return None
