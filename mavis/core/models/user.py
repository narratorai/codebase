import contextlib
import json
from dataclasses import dataclass
from datetime import timedelta

from core.errors import CompanyArchivedError, ForbiddenError, InvalidPermission, MissingUserError
from core.graph import graph_client
from core.graph.sync_client.auth_get_user_company import (
    AuthGetUserCompany,
    AuthGetUserCompanyCompanies,
    AuthGetUserCompanyUser,
)
from core.graph.sync_client.enums import access_role_enum, company_status_enum, user_role_enum
from core.util.redis import redis_client


ROLE_DETAILS = {
    access_role_enum.can_use_sql: dict(
        label="Can run SQL",
        description="Can run SQL queries in Dataset",
    ),
    access_role_enum.create_chat: dict(
        label="Create Chat",
        description="Can create chat",
    ),
    access_role_enum.create_dataset: dict(
        label="Create Dataset",
        description="Can create dataset",
    ),
    access_role_enum.create_dataset_integeration: dict(
        label="Create Dataset Integration",
        description="Can create dataset non warehouse integration (ex. google sheets)",
    ),
    access_role_enum.create_dataset_materialize_view: dict(
        label="Create Dataset Warehouse Integration",
        description="Can create dataset warehouse integration (ex. materialized view or view)",
    ),
    access_role_enum.create_dataset_training: dict(
        label="Create Dataset Training",
        description="Can create dataset training",
    ),
    access_role_enum.create_report: dict(
        label="Create Report",
        description="Can create reports",
    ),
    access_role_enum.download_data: dict(
        label="Download Data",
        description="Can download data",
    ),
    access_role_enum.manage_api: dict(
        label="Manage API",
        description="Can manage API settings / create API keys",
    ),
    access_role_enum.manage_billing: dict(
        label="Manage Billing",
        description="Can manage billing settings",
    ),
    access_role_enum.manage_connection: dict(
        label="Manage Connection",
        description="Can manage connections",
    ),
    access_role_enum.manage_custom_function: dict(
        label="Manage Custom Function",
        description="Can manage custom functions",
    ),
    access_role_enum.manage_processing: dict(
        label="Manage Processing",
        description="Can run & cancel data processing",
    ),
    access_role_enum.manage_processing_config: dict(
        label="Manage Processing Config",
        description="Can update processing configuration (ex. schedule, label)",
    ),
    access_role_enum.manage_tags: dict(
        label="Manage Tags",
        description="Can manage tags (update color, delete, add)",
    ),
    access_role_enum.manage_tickets: dict(
        label="Manage Tickets",
        description="Can manage tickets",
    ),
    access_role_enum.manage_transformations: dict(
        label="Manage Transformations",
        description="Can create/update/delete data transformations",
    ),
    access_role_enum.manage_users: dict(
        label="Manage Users",
        description="Can manage users (add/remove users and teams, etc.).  This user can only add the roles they have access to.",
    ),
    access_role_enum.view_activities: dict(
        label="View Activities",
        description="Can view activities",
    ),
    access_role_enum.view_billing: dict(
        label="View Billing",
        description="Can view billing information",
    ),
    access_role_enum.view_chat: dict(
        label="View Chat",
        description="Can use chat - See it in the UI",
    ),
    access_role_enum.view_customer_journey: dict(
        label="View Customer Journey",
        description="Can use customer journey - See it in the UI",
    ),
    access_role_enum.view_dataset: dict(
        label="View Dataset",
        description="Can use Dataset - See it in the UI",
    ),
    access_role_enum.view_processing: dict(
        label="View Processing",
        description="Can view data processing - See it in the UI",
    ),
    access_role_enum.view_report: dict(
        label="View Report",
        description="Can view reports - See it in the UI",
    ),
    access_role_enum.view_private: dict(
        label="View Any Item",
        description="Can view any object that the user doesn't have access to (ex. private dataset) - Will not see the items in the index but can be opened with a link",
    ),
    access_role_enum.update_private: dict(
        label="Update Any Item",
        description="Can update any object that the user doesn't have access to (ex. private dataset) - Will not see the items in the index but can be opened with a link",
    ),
    access_role_enum.admin: dict(
        label="Admin",
        description="(DANGER) Can view all private content, and do everything independent of roles",
    ),
}


@dataclass
class UserCompany:
    id: str
    slug: str
    auth0_org_id: str
    name: str | None
    everyone_team_id: str


@dataclass
class UserTags:
    favorite: str | None
    recently_viewed: str | None


@dataclass
class AuthenticatedUser:
    id: str
    email: str
    company: UserCompany
    tags: UserTags
    team_ids: list[str] | None = None
    access_roles: list[access_role_enum] | None = None
    token: str | None = None
    is_admin: bool = False

    is_internal_admin: bool = False
    """ONLY for internal use"""

    @property
    def company_slug(self):
        return self.company.slug

    @property
    def company_id(self):
        return self.company.id

    @property
    def user_id(self):
        return self.id

    @classmethod
    def create(cls, user_id: str, auth0_org_id: str, auth_token: str | None):
        user, company = get_user_company(user_id, auth0_org_id)

        # handle the user and company finding
        if not user or not company:
            raise ForbiddenError("Company or User could not be found. Please contact your administrator or support.")

        is_internal_admin = user.role == user_role_enum.internal_admin
        company_user = next((cu for cu in user.company_users if cu.company_id == company.id), None)

        # create the values
        if not is_internal_admin:
            if company.status == company_status_enum.archived:
                # Only Narrator admins can access archived companies
                raise CompanyArchivedError
            elif not company_user:
                raise ForbiddenError("You do not have access to this company, please contact your administrator.")

        # simplify the permissions to make it easier to create the object
        everyone_team_id = next((t.id for t in company.teams if t.name == "Everyone"))

        if is_internal_admin:
            auth_roles = [r.value for r in access_role_enum]

        elif company_user is None or len(company_user.user_access_roles) == 0:
            # DEFAULT ROLES - These are the roles that everyone should have at the start
            auth_roles = [
                access_role_enum.can_use_sql,
                access_role_enum.create_chat,
                access_role_enum.create_dataset,
                access_role_enum.create_dataset_integeration,
                access_role_enum.create_dataset_training,
                access_role_enum.create_report,
                access_role_enum.download_data,
                access_role_enum.view_activities,
                access_role_enum.view_chat,
                access_role_enum.view_customer_journey,
                access_role_enum.view_dataset,
                access_role_enum.view_processing,
                access_role_enum.view_report,
            ]
        else:
            auth_roles = [t.role for t in company_user.user_access_roles]

        return AuthenticatedUser(
            id=user_id,
            email=user.email,
            is_internal_admin=is_internal_admin,
            team_ids=([t.team_id for t in company_user.team_users] if company_user else []),
            tags=UserTags(
                favorite=next(
                    (ct.id for ct in company.company_tags if ct.tag == "favorite"),
                    None,
                ),
                recently_viewed=next(
                    (ct.id for ct in company.company_tags if ct.tag == "recently_viewed"),
                    None,
                ),
            ),
            access_roles=auth_roles,
            is_admin=is_internal_admin or access_role_enum.admin in auth_roles,
            company=UserCompany(
                id=company.id,
                slug=company.slug,
                name=company.name,
                auth0_org_id=auth0_org_id,
                everyone_team_id=everyone_team_id,
            ),
            token=auth_token,
        )

    def require_role(self, role: access_role_enum):
        if not self.is_admin and role not in self.access_roles:
            raise InvalidPermission(f"User does not have access to {ROLE_DETAILS[role]['label']}")

    def has_role(self, role: access_role_enum):
        return self.is_admin or role in self.access_roles


def get_user_company(
    user_id: str, auth0_org_id: str, refresh_cache: bool = False
) -> tuple[AuthGetUserCompanyUser | None, AuthGetUserCompanyCompanies | None]:
    """
    Get the user and company from graph.
    """
    key = f"user:{user_id}:{auth0_org_id}"

    if not refresh_cache:
        with contextlib.suppress(Exception):
            if comp := redis_client.get(key):
                try:
                    data = AuthGetUserCompany(**json.loads(comp))
                    return data.user, data.companies[0]
                except Exception:
                    redis_client.delete(key)

    try:
        data = graph_client.auth_get_user_company(user_id=user_id, auth0_org_id=auth0_org_id)
        redis_client.setex(
            key,
            timedelta(days=30),
            data.json(),
        )
    except Exception as e:
        if redis_client.exists(key):
            redis_client.delete(key)

        raise MissingUserError() from e

    if data.companies:
        return data.user, data.companies[0]

    return None, None
