import contextlib
import json
from datetime import timedelta

import boto3
import sentry_sdk
from pydantic import BaseModel, Field

from core.constants import COLORS, PRODUCT_COLORS, TABLE_COLORS
from core.errors import InvalidPermission, MissingCompanyError, SilenceError

# from core.github_client import GithubClient
from core.graph import graph_client
from core.graph.sync_client.enums import company_status_enum
from core.graph.sync_client.get_company import GetCompanyCompanies
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.models.settings import settings
from core.s3_data import S3Data
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.util.redis import redis_client
from core.v4.query_mapping.config import CONFIG

from .user import AuthenticatedUser, UserCompany, UserTags

logger = get_logger()


class CustomerDim(BaseModel):
    id: UUIDStr
    schema_name: str | None
    table: str


class TeamPermission(BaseModel):
    team_id: str
    can_edit: bool | None = True


class CompanyTable(BaseModel):
    id: UUIDStr
    updated_at: str
    identifier: str
    activity_stream: str
    schema_name: str | None
    row_count: int | None
    is_imported: bool | None
    maintainer_id: UUIDStr | None = None
    customer_dim_table_id: str | None
    customer_dim: CustomerDim | None
    manually_partition_activity: bool | None
    default_time_between: str | None
    team_ids: list[str] | None
    team_permissions: list[TeamPermission] = Field(default_factory=list)
    color: str = TABLE_COLORS[0]

    class Config:
        validate_all = True
        allow_mutation = False


class CompanyTeam(BaseModel):
    id: str
    name: str
    color: str = PRODUCT_COLORS[0]


class CompanyTag(BaseModel):
    id: str
    tag: str
    color: str = PRODUCT_COLORS[0]


class CompanyUserDetail(BaseModel):
    id: UUIDStr
    user_id: UUIDStr
    email: str
    first_name: str | None
    last_name: str | None
    avatar_url: str | None


class CompanyResources(BaseModel):
    company_role: str | None
    kms_key: str | None
    s3_bucket: str | None

    class Config:
        validate_all = True
        allow_mutation = False


class Company(BaseModel):
    id: UUIDStr
    slug: str
    status: company_status_enum
    name: str | None
    created_at: str = Field(None, repr=False)
    updated_at: str = Field(None, repr=False)

    production_schema: str = Field(..., repr=False)
    materialize_schema: str = Field(..., repr=False)

    warehouse_language: str

    website: str = Field(None, repr=False)

    timezone: str
    cache_minutes: int = Field(..., repr=False)
    datacenter_region: str = Field(None, repr=False)

    logo_url: str = Field(None, repr=False)
    spend_table: str = Field(None, repr=False)
    locale: str = Field("en", repr=False)
    batch_halt: bool | None
    use_time_boundary: bool | None
    week_day_offset: int | None
    validation_months: int = Field(None, repr=False)
    select_wlm_count: int = Field(None, repr=False)
    start_data_on: str = Field(None, repr=False)
    currency_used: str = Field(None, repr=False)

    # Important
    tables: list[CompanyTable] = Field(None, repr=False)
    warehouse_default_schemas: str = Field(None, repr=False)
    plot_colors: list[str] = Field(None, repr=False)

    dataset_row_threshold: int = Field(None, repr=False)
    dataset_default_filter_days: int = Field(None, repr=False)

    teams: list[CompanyTeam] = Field(None, repr=False)
    tags: list[CompanyTag] = Field(None, repr=False)
    users: list[CompanyUserDetail] = Field(None, repr=False)

    # Provisioned resources
    resources: CompanyResources = Field(None, repr=False)

    # only matters for big query
    project_id: str = Field(None, repr=False)

    # DYNAMIC
    bucket_directory: str = "prod"  # FIXME don't default this! Move to settings?!?
    warehouse_schema: str  # dynamically generated from kwargs in init

    # INTERNAL
    secrets: dict = Field(dict(), repr=False, exclude=True)
    s3: S3Data = Field(..., repr=False, exclude=True)

    # API
    current_user: AuthenticatedUser

    @property
    def user(self):
        return self.current_user

    @property
    def everyone_team_id(self):
        return next((t.id for t in self.teams if t.name == "Everyone"), None)

    class Config:
        arbitrary_types_allowed = True  # required for s3
        validate_all = True
        validate_assignment = True
        allow_mutation = False

    @tracer.start_as_current_span("init_company")
    def __init__(self, **kwargs):
        # Inject s3 client
        company_resources = kwargs["resources"]

        # if kwargs.get("github_sync") and kwargs["github_sync"][0] is not None:
        #     # Inject github config
        #     kwargs["github"] = GithubClient(
        #         company_slug=kwargs["slug"],
        #         installation_id=kwargs["github_sync"][0]["installation_id"],
        #         target_repo=kwargs["github_sync"][0]["target_repo"],
        #     )

        kwargs["s3"] = S3Data(
            company_slug=kwargs["slug"],
            company_role_arn=company_resources["company_role"],
            company_bucket=company_resources["s3_bucket"],
            company_key_id=company_resources["kms_key"],
        )
        kwargs["users"] = [
            CompanyUserDetail(
                **u, email=u["user"]["email"], avatar_url=(u.get("preferences") or {}).get("profile_picture")
            )
            for u in kwargs.get("company_users", [])
        ]

        # Add teams to the graph
        for ii, t in enumerate(kwargs.get("teams", [])):
            if t["name"] == "Everyone":
                t["color"] = "white"
            else:
                t["color"] = PRODUCT_COLORS[ii % len(PRODUCT_COLORS)]

        # Add teams to the graph
        for ii, t in enumerate(kwargs.get("tables", [])):
            t["color"] = TABLE_COLORS[ii % len(TABLE_COLORS)]

        for ii, t in enumerate(kwargs.get("tags", [])):
            t["color"] = PRODUCT_COLORS[(len(PRODUCT_COLORS) - 1 - ii) % len(PRODUCT_COLORS)]

        # Inject warehouse_schema
        kwargs["warehouse_schema"] = kwargs["production_schema"]

        # convert the text to an array to make the colors easier to use
        if kwargs.get("plot_colors"):
            kwargs["plot_colors"] = kwargs["plot_colors"].split(",")
        else:
            kwargs["plot_colors"] = COLORS

        # clean up the permissions
        for t in kwargs.get("tables", []):
            t["team_ids"] = [tp["team_id"] for tp in t.get("team_permissions", [])]
        super().__init__(**kwargs)

    @tracer.start_as_current_span("import_mavis")
    def mavis(self):
        from core.v4.mavis import Mavis

        return Mavis(company=self)

    def company_user(self, user_id: UUIDStr):
        return next((u for u in self.users if u.id == user_id), None)

    def table(self, id_or_slug: str, raise_error: bool = False) -> CompanyTable | None:
        t = next(
            (t for t in self.tables if id_or_slug in (t.activity_stream, t.id)),
            None,
        )
        if t is not None:
            # check if there is an overlap in team_ids
            if self.user.is_admin or (t.team_ids and self.user.team_ids and set(t.team_ids) & set(self.user.team_ids)):
                return t
            else:
                raise InvalidPermission("You do not have access to this table")
        else:
            if raise_error:
                raise SilenceError("Table not found or you do not have permissions for the table")
            else:
                return None

    def load_secret(self, secret_name: str):
        """
        Loads a secret from s3
        """
        return self.s3.get_file(f"secrets/{secret_name}.json", cache=True)

    def _upload_secret(self, secret_name: str, secret_obj):
        upload_to = f"secrets/{secret_name}.json"
        self.s3.upload_object(secret_obj, upload_to)

    def _delete_secret(self, secret_name: str):
        upload_to = f"secrets/{secret_name}.json"
        self.s3.delete_object(upload_to)

        logger.info("Secret deleted", secret_name=secret_name)

    @tracer.start_as_current_span("publish_mavis_event")
    def publish_sns(self, event_kind=None, subject: str = None, message: dict = None):
        """
        Publishes messages to mavis's internal sns topic.
        Queues and lambdas can listen for these.
        """
        set_current_span_attributes(event_kind=event_kind, subject=subject)

        # prepare for json, serialize str
        message = message or {}
        message = {key: value for key, value in message.items()}

        try:
            sns = boto3.client("sns")

            logger.info("publishing sns", event_kind=event_kind)
            sns.publish(
                TopicArn=settings.mavis_notification_topic,
                Subject=subject,
                Message=json.dumps(message),
                MessageAttributes={
                    "event_kind": {"DataType": "String", "StringValue": event_kind},
                    "company": {"DataType": "String", "StringValue": self.slug},
                    "stage": {"DataType": "String", "StringValue": settings.stage},
                },
            )
        except Exception as e:
            # Swallowed error to not fail the job
            logger.error(
                "Failed to emit event",
                swallowed=True,
                event_kind=event_kind,
                topic=settings.mavis_notification_topic,
                exc_info=e,
            )
            sentry_sdk.capture_exception(e)

    def get_task_id(self, task_slug: str):
        tasks = graph_client.get_task_by_slug(company_id=self.id, slug=task_slug).company_task
        if tasks:
            return tasks[0].id


def query_graph_company(slug: str, refresh_cache: bool = False):
    """
    :param slug: the company slug
    :param refresh_cache: if true, bust the cache
    """
    if not refresh_cache:
        with contextlib.suppress(Exception):
            if comp := redis_client.get(f"company:{slug}"):
                return GetCompanyCompanies(**json.loads(comp))
    try:
        response = graph_client.get_company(slug=slug)
        redis_client.setex(f"company:{slug}", timedelta(days=30), response.companies[0].json())
        return response.companies[0]
    except Exception as e:
        raise MissingCompanyError() from e


# used by mavis to get the data source
def _get_datasource(company_slug: str):
    company = initialize_company(company_slug)
    options = company.load_secret(company.warehouse_language)
    return CONFIG[company.warehouse_language]["query_runner"](options)


@tracer.start_as_current_span("initialize_company")
def initialize_company(company_slug: str, *, refresh_cache: bool = False):
    if not company_slug:
        raise MissingCompanyError()

    graph_company = query_graph_company(company_slug, refresh_cache=refresh_cache)
    ahmed_user = AuthenticatedUser(
        id="5d8fd6f3-b5d9-42fd-a04a-7ecaa8883aa1",
        email="ahmed@narrator.ai",
        tags=UserTags(favorite=None, recently_viewed=None),
        is_internal_admin=True,
        is_admin=True,
        company=UserCompany(
            id=graph_company.id,
            slug=graph_company.slug,
            name=graph_company.name,
            everyone_team_id=next((t.id for t in graph_company.teams if t.name == "Everyone"), None),
            auth0_org_id="",
        ),
    )

    company = Company(**graph_company.dict(), current_user=ahmed_user)
    logger.debug("Initialized company")

    return company
