from core.api.customer_facing.utils.query import BasicHandler, QueryBuilder
from core.constants import CREATE_USER_TAGS
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum, company_user_role_enum
from core.graph.sync_client.get_company_users import GetCompanyUsersCompanyUser
from core.logger import get_logger
from core.models.company import query_graph_company
from core.models.ids import UUIDStr
from core.models.user import get_user_company

from ..utils.decorator import ensure_company, require_admin
from ..utils.updator import ItemUpdator
from .helpers import (
    add_user_to_company_auth,
    email_invitation,
    get_all_invitations,
    remove_user_from_company_auth,
    update_inventation,
)

logger = get_logger()


class BasicUserHandler(BasicHandler):
    @property
    def index_name(self):
        return "user"

    @property
    def related_key(self):
        return None

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            "team_ids": {"type": "keyword"},
            "created_at": {"type": "date"},
            # fields used for using
            "user_id": {"type": "keyword"},
            "roles": {"type": "keyword"},
            "email": {"type": "text"},
            "first_name": {"type": "text"},
            "last_name": {"type": "text"},
            "job_title": {"type": "text"},
        }

    @property
    def search_fields(self):
        return ["email^3", "first_name^2", "last_name", "job_title"]

    @property
    def filter_fields(self):
        return ["roles", "awaiting_invitation", "email"]

    @property
    def sort_by(self) -> list[tuple]:
        return [("created_at", "desc")]

    @property
    def use_semantic_search(self):
        return False


class UserQueryBuilder(BasicUserHandler, QueryBuilder):
    def pre_process_filters(self):
        if self.filters.get("awaiting_invitation"):
            invitations = get_all_invitations(self.user.company)
            self.filters["email"] = list(invitations.keys())
            self.filters.pop("awaiting_invitation")

    def combine_search_and_graph_data(self, search_result: dict, graph_data: list[dict] | None):
        # add the invitations for the user
        invitations = get_all_invitations(self.user.company)
        return dict(
            **search_result,
            awaiting_invitation=search_result["email"] in invitations,
            invitation_expires_at=invitations.get(search_result["email"]),
        )


class UserUpdator(BasicUserHandler, ItemUpdator):
    @property
    def index_name(self):
        return "user"

    def get(self, id: UUIDStr):
        return graph_client.get_company_user(id=id).company_user_by_pk

    def get_search_data(self, id: UUIDStr):
        row = self.get(id)
        team_ids = [t.team_id for t in row.team_users]
        roles = [r.role for r in row.user_access_roles]

        # # Handle backfilling the teams
        if row.role == company_user_role_enum.admin and access_role_enum.admin not in roles:
            graph_client.insert_user_role(
                company_user_id=row.id,
                role=access_role_enum.admin,
            )
            roles.append(access_role_enum.admin)

        if self.user.company.everyone_team_id not in team_ids:
            graph_client.insert_user_team(
                company_user_id=row.id,
                team_id=self.user.company.everyone_team_id,
            )

        return dict(
            id=row.id,
            created_at=row.created_at,
            user_id=row.user.id,
            email=row.user.email,
            first_name=row.first_name,
            last_name=row.last_name,
            job_title=row.job_title,
            team_ids=team_ids,
            roles=roles,
        )


class UserManager(UserUpdator):
    @require_admin
    def transfer_user(self, user_id: UUIDStr, to_user_id: UUIDStr):
        results = graph_client.transfer_user_items(
            company_id=self.company.id,
            user_id=user_id,
            new_user_id=to_user_id,
        )

        from core.api.customer_facing.datasets.utils import DatasetUpdator
        from core.api.customer_facing.reports.utils import NarrativeUpdator
        from core.api.customer_facing.transformations.utils import TransformationUpdator

        # Update all the items that were transferred
        for t in results.update_dataset:
            DatasetUpdator(mavis=self.mavis)._update_created_by(t.id, to_user_id)
        for t in results.update_narrative:
            NarrativeUpdator(mavis=self.mavis)._update_created_by(t.id, to_user_id)
        for t in results.update_transformation:
            TransformationUpdator(mavis=self.mavis)._update_created_by(t.id, to_user_id)

    def delete(self, id: UUIDStr):
        # Transfer everything to the current user
        self.transfer_user(id, self.user.id)
        remove_user_from_company_auth(id, self.user.company)
        # reset the cache to ensure the user is good
        get_user_company(id, self.user.company.auth0_org_id, refresh_cache=True)
        self.delete_id(id)

    def resend_invitation(self, email: str):
        invitation = update_inventation(email, self.user.company)

        # if the invitation exists then resend it
        if invitation:
            email_invitation(invitation, self.user.company, email)
        else:
            self.create(email)

    @ensure_company
    def update_avatar(self, user_id: UUIDStr, avatar_url: str):
        if company_user := self.company.company_user(user_id):
            graph_client.update_user_avatar(
                company_user_id=company_user.id,
                profile_picture=avatar_url,
            )

    def create(
        self,
        email: str = None,
        first_name: str = None,
        last_name: str = None,
        job_title: str = None,
        skip_email=False,
    ):
        # clean up the email always
        email = email.lower().strip(" ")

        # insert into company user
        user = graph_client.create_user(email=email).insert_user_one

        # Add the tags for the user
        for t in CREATE_USER_TAGS:
            graph_client.insert_tag(
                company_id=self.user.company.id,
                user_id=user.id,
                tag=t,
                color="#D00000",
            )

        template_model = add_user_to_company_auth(self.user.company, user.id, email, first_name, skip_email)

        logger.info("Adding user to graph")
        # Add the user to the company
        company_user_id = graph_client.add_user_to_company(
            company_id=self.user.company.id,
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            job_title=job_title,
        ).insert_company_user_one.id

        logger.info("Adding teams")
        # add the user to the team
        graph_client.insert_user_team(
            company_user_id=company_user_id,
            team_id=self.user.company.everyone_team_id,
        )
        self.resync_id(company_user_id)
        return template_model if skip_email else (user.id, company_user_id)

    def reset(self, user_id: str):
        # DO this to ensure we don't cache the wrong auth0_org_id
        if self.user.company.auth0_org_id == "":
            self.user.company.auth0_org_id = graph_client.get_auth_org(company_id=self.user.company.id).auth[0].org_id
        get_user_company(user_id, self.user.company.auth0_org_id, refresh_cache=True)
        query_graph_company(self.user.company.slug, refresh_cache=True)

    @require_admin
    def add_role(self, user_id: str, role: access_role_enum):
        id = self.get_company_user(user_id).id
        graph_client.insert_user_role(
            company_user_id=id,
            role=role,
        )

        # add any dependency
        if role == access_role_enum.update_private:
            graph_client.insert_user_role(
                company_user_id=id,
                role=access_role_enum.view_private,
            )

        self.resync_id(id)
        self.reset(user_id)

    @require_admin
    def delete_role(self, user_id: str, role: str):
        id = self.get_company_user(user_id).id
        graph_client.delete_user_role(
            company_user_id=id,
            role=role,
        )
        if role == access_role_enum.view_private:
            graph_client.delete_user_role(
                company_user_id=id,
                role=access_role_enum.update_private,
            )
        self.resync_id(id)
        self.reset(user_id)

    def add_team(self, user_id: str, team_id: UUIDStr):
        id = self.get_company_user(user_id).id
        graph_client.insert_user_team(
            company_user_id=id,
            team_id=team_id,
        )
        self.resync_id(id)
        self.reset(user_id)

    def delete_team(self, user_id: str, team_id: UUIDStr):
        id = self.get_company_user(user_id).id
        graph_client.delete_user_team(
            company_user_id=id,
            team_id=team_id,
        )
        self.resync_id(id)
        self.reset(user_id)

    def update(
        self,
        id: UUIDStr,
        first_name: str = None,
        last_name: str = None,
        job_title: str = None,
    ):
        graph_client.add_user_to_company(
            company_id=self.user.company.id,
            user_id=id,
            first_name=first_name,
            last_name=last_name,
            job_title=job_title,
        )
        self.update_search_data(id, dict(first_name=first_name, last_name=last_name, job_title=job_title))

    def get_company_user(self, user_id: UUIDStr) -> GetCompanyUsersCompanyUser:
        company_users = graph_client.get_company_user_id(company_id=self.user.company.id, user_id=user_id).company_user
        if not company_users:
            raise SilenceError("User is not associated with the company")
        return company_users[0]
