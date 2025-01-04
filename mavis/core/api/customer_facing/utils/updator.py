from dataclasses import dataclass
from datetime import datetime, timedelta

from pydantic import BaseModel

from core.api.customer_facing.utils.decorator import ensure_company
from core.api.customer_facing.utils.pydantic import TeamPermission, Version
from core.api.customer_facing.utils.query import BasicHandler, internal_track
from core.decorators.task import task
from core.errors import InvalidPermission
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.logger import get_logger
from core.models.company import Company
from core.models.ids import UUIDStr, get_uuid
from core.models.time import minutes_ago
from core.models.user import AuthenticatedUser
from core.util.llm import text_to_vector
from core.util.opensearch import opensearch_client
from core.util.redis import redis_client
from core.v4.mavis import Mavis

logger = get_logger()


@dataclass
class Updator(BasicHandler):
    user: AuthenticatedUser | None = None
    mavis: Mavis | None = None
    company: Company | None = None

    def __post_init__(self):
        if self.mavis:
            self.company = self.mavis.company

        if self.company:
            self.user = self.company.user

        self.cached_created_by = {}

    def track(self, action: str, object_id: UUIDStr | None = None, data: dict | None = None):
        internal_track(self.user, self.related_key, action, object_id, data)

    def _get_created_by(self, id: UUIDStr):
        return None

    def vectorize(self, search_data: dict):
        if search_data.get("description"):
            return search_data["description"]
        return search_data["name"]

    def get(self, id: UUIDStr):
        return None

    def get_search_data(self, id: UUIDStr):
        return None

    def get_created_by(self, id: UUIDStr):
        if id in self.cached_created_by:
            return self.cached_created_by[id]
        created_by = self._get_created_by(id)
        self.cached_created_by[id] = created_by
        return created_by

    def check_create_permissions(self):
        pass  # TODO: Add the role check here

    def check_company(self, item: dict | BaseModel):
        if isinstance(item, dict):
            if (
                item.get("company_slug")
                and item["company_slug"] != self.user.company_slug
                or item.get("company_id")
                and item["company_id"] != self.user.company_id
            ):
                raise InvalidPermission("Invalid ID: No object found for this id")
        elif isinstance(item, BaseModel):
            if (
                hasattr(item, "company_slug")
                and item.company_slug != self.user.company_slug
                or hasattr(item, "company_id")
                and item.company_id != self.user.company_id
            ):
                raise InvalidPermission("Invalid ID: No object found for this id")

    def check_get_permissions(self, team_permissions: list[TeamPermission], created_by: UUIDStr):
        if not (
            self.user.has_role(access_role_enum.view_private)
            or self.user.id == created_by
            or set(t.id for t in team_permissions) & set(self.user.team_ids)
        ):
            raise InvalidPermission(f"User does not have permission to GET this {self.display_name}")

    def check_update_permissions(self, id: UUIDStr, return_bool: bool = False, obj: BaseModel | None = None):
        if self.user.has_role(access_role_enum.update_private):
            return True

        # Keep the key for 15 minutes to prevent race conditions
        lock_key = f"can_update:{self.related_key}:{id}:{self.user.id}"
        if obj is None and redis_client.get(lock_key) == "yes":
            return True

        if obj is None:
            obj = self.get(id)

        if obj.created_by == self.user.id:
            return True

        if not (set(t.team_id for t in obj.team_permissions if t.can_edit) & set(self.user.team_ids)):
            if return_bool:
                return False
            else:
                raise InvalidPermission(f"User does not have permission to UPDATE this {self.display_name}")

        # cache the key if it has proper permissions
        redis_client.setex(lock_key, timedelta(minutes=15), "yes")
        return True

    def _process_common_graph_data(self, graph_row: dict):
        graph_row["company_slug"] = self.user.company.slug
        if graph_row.get("created_by"):
            graph_row["user_id"] = graph_row.get("created_by")

        if graph_row.get("tags"):
            graph_row["tag_ids"] = [
                tag.get("tag_id")
                for tag in graph_row["tags"]
                if tag.get("company_tag") and tag["company_tag"].get("user_id") is None
            ]
            graph_row["favorited_by"] = [
                tag["tag_id"]
                for tag in graph_row["tags"]
                if tag.get("company_tag") and tag["company_tag"].get("tag") == "favorite"
            ]

            if "user_views" in self.index_properties:
                graph_row["user_views"] = [
                    dict(viewed_at=tag["updated_at"][:19], user_id=tag["company_tag"]["user_id"])
                    for tag in graph_row["tags"]
                    if tag.get("company_tag") and tag["company_tag"].get("tag") == "recently_viewed"
                ]

        if "team_ids" in self.index_properties:
            if graph_row.get("team_permissions"):
                graph_row["team_ids"] = [team.get("team_id") for team in graph_row.get("team_permissions")]
            else:
                graph_row["team_ids"] = []

            # always include this
            if graph_row.get("user_id"):
                graph_row["team_ids"].append("user:" + graph_row["user_id"])

        return graph_row

    def update_search_data(self, id: UUIDStr, search_data: dict, vectorize: bool = False):
        if vectorize:
            search_data["vec"] = text_to_vector(self.vectorize(search_data))

        try:
            opensearch_client.update(
                self.index_name,
                id,
                body={"doc": search_data},
            )
        except Exception:
            self.resync_id(id)
            opensearch_client.update(
                self.index_name,
                id,
                body={"doc": search_data},
            )

        return search_data

    def create_search_data(self, search_data: dict):
        self._process_common_graph_data(search_data)
        search_data["user_id"] = self.user.id
        opensearch_client.index(
            index=self.index_name,
            id=search_data["id"],
            body=search_data,
        )
        return None

    def resync_id(self, id: UUIDStr):
        search_data = self.get_search_data(id)
        if search_data:
            logger.debug("Resyncing", id=id)
            self._process_common_graph_data(search_data)
            if self.use_semantic_search:
                search_data["vec"] = text_to_vector(self.vectorize(search_data))

            # override nulls
            search_data = {k: v for k, v in search_data.items() if v is not None}

            # update the row
            res = opensearch_client.update(
                index=self.index_name,
                id=search_data["id"],
                body={"doc": search_data, "doc_as_upsert": True},
            )
            logger.debug("Updated search data", id=id, res=res)
            return True
        else:
            self.delete_id(id)
        return False

    def delete_id(self, id: UUIDStr):
        try:
            opensearch_client.delete(index=self.index_name, id=id)
        except Exception as e:
            logger.error("Error deleting id from opensearch", id=id, error=e)

    def get_index_row(self, id: UUIDStr, source: list[str] | None = None):
        if source is None:
            source = list(self.index_properties.keys())
        try:
            return opensearch_client.get(index=self.index_name, id=id, _source=source)["_source"]
        except Exception:
            self.resync_id(id)
            return self.get_index_row(id, source)

    def _update_created_by(self, id: UUIDStr, user_id: UUIDStr):
        row = self.get_index_row(id, ["user_id", "team_ids"])
        if row.get("user_id") and row.get("user_id") != user_id:
            row["user_id"] = user_id

        if row.get("team_ids") and "user:" + user_id not in row["team_ids"]:
            row["team_ids"] = [t for t in row["team_ids"] if not t.startswith("user:")] + ["user:" + user_id]

        self.update_search_data(id, row)
        return None


class ItemUpdator(Updator):
    def _get_basic(self, id: UUIDStr):
        return None

    def favorite(self, id: UUIDStr):
        graph_client.insert_tag_item_one(
            related_id=id,
            related_to=self.related_key,
            tag_id=self.user.tags.favorite,
        )
        favorited_by = self.get_index_row(id, ["favorited_by"])
        # force the list if it is not there
        if not isinstance(favorited_by, list):
            favorited_by = []

        if self.user.id not in favorited_by:
            favorited_by.append(self.user.id)
            self.update_search_data(id, {"favorited_by": favorited_by})

    def unfavorite(self, id: UUIDStr):
        graph_client.delete_tag_item(
            related_id=id,
            related_to=self.related_key,
            tag_id=self.user.tags.favorite,
        )
        favorited_by = self.get_index_row(id, ["favorited_by"])
        if self.user.id in favorited_by:
            favorited_by.remove(self.user.id)
            self.update_search_data(id, {"favorited_by": favorited_by})

    def check_dependent_permission(self, id: UUIDStr, permissions: TeamPermission):
        """Applies any custom checks for the permissions like dependency, roles check and more"""
        return None

    def update_permissions(
        self,
        id: UUIDStr,
        permissions: list[TeamPermission],
        share_with_everyone: bool = False,
        skip_check: bool = False,
    ):
        if not skip_check:
            self.check_update_permissions(id)
            self.check_dependent_permission(id, permissions)

        if share_with_everyone:
            permissions.append(TeamPermission(id=self.user.company.everyone_team_id, can_edit=False))

        permissions_list = [
            dict(
                team_id=permission.id,
                can_edit=permission.can_edit,
                related_id=id,
                related_to=self.related_key,
            )
            for permission in permissions
        ]

        updated_permissions = graph_client.update_team_permissions(
            permissions=permissions_list,
            related_id=id,
            related_to=self.related_key,
        )
        if self.has_search:
            # update the team ids
            team_ids = [p.id for p in permissions]
            if user_id := self._get_created_by(id):
                team_ids.append("user:" + user_id)

            self.update_search_data(id, {"team_ids": team_ids})
        return updated_permissions

    def update_tags(self, id: UUIDStr, tag_ids: list[UUIDStr]) -> bool:
        self.check_update_permissions(id)
        tag_inputs = [
            dict(
                tag_id=tag_id,
                related_id=id,
                related_to=self.related_key,
            )
            for tag_id in tag_ids
        ]
        updated_tags = graph_client.update_item_tags(
            tag_ids=tag_ids, related_id=id, related_to=self.related_key, tag_inputs=tag_inputs
        )
        # update the tag ids
        self.update_search_data(id, {"tag_ids": tag_ids})
        return updated_tags.delete_tag.affected_rows > 0 or updated_tags.insert_tag.affected_rows > 0

    def log_view(self, id: UUIDStr):
        if self.user.tags.recently_viewed:
            async_log_view.send(self.user.id, self.related_key, self.index_name, self.user.tags.recently_viewed, id)
        return None

    def versions(self, id: UUIDStr, per_page: int = 10, page: int = 1):
        offset = (page - 1) * per_page
        return {
            "page": page,
            "per_page": per_page,
            "data": graph_client.get_versions(
                related_to=self.related_key, id=id, offset=offset, limit=per_page
            ).versions,
        }

    @ensure_company
    def get_config(
        self, id: UUIDStr, version_id: UUIDStr | None = None, with_version: bool = False
    ) -> tuple[dict, Version]:
        # get last version
        if version_id:
            version = graph_client.get_version(version_id=version_id).versions_by_pk
        else:
            versions = graph_client.get_versions(related_to=self.related_key, id=id).versions
            if len(versions) == 0:
                version = self._backfill_version(id)
            else:
                version = versions[0]
        logger.debug(f"Getting {self.related_key} config", version_id=version.id, s3_key=version.s3_key)
        # DEAL WITH VERSIONS
        config = self.company.s3.get_file([version.s3_key])
        if with_version:
            return (config, version)
        else:
            return config

    @ensure_company
    def update_config(self, id: UUIDStr, config: dict | BaseModel) -> tuple[bool, UUIDStr | None]:
        versions = graph_client.get_versions(related_to=self.related_key, id=id).versions
        logger.debug(f"Updating {self.related_key} config", id=id, versions=versions)
        recently_updated_by_id = None
        if len(versions) > 0 and versions[0].user_id != self.user.id and versions[0].created_at > minutes_ago(15):
            recently_updated_by_id = versions[0].user_id

        is_new = False
        # if the version is older than 15 minutes then we need to create a new one
        if len(versions) == 0 or versions[0].user_id != self.user.id or versions[0].created_at < minutes_ago(15):
            logger.debug(f"Creating new {self.related_key} version", id=id)
            s3_key = f"configs/{self.related_key}s/{get_uuid()}.json"
            is_new = True
        else:
            logger.debug("Updating existing dataset version", id=id)
            s3_key = versions[0].s3_key

        self.company.s3.upload_object(
            config.dict() if not isinstance(config, dict) else config,
            [s3_key],
        )
        if is_new:
            graph_client.insert_version(related_to=self.related_key, id=id, user_id=self.user.id, s3_key=s3_key)

        return (is_new, recently_updated_by_id)

    def _backfill_shared(self, id: UUIDStr, row: dict):
        if self.user.company.everyone_team_id not in [t["team_id"] for t in row["team_permissions"]]:
            tp = [t.dict() for t in row["team_permissions"]]
            tp.append(dict(team_id=self.user.company.everyone_team_id, can_edit=False))
            tp = [t | dict(related_id=id, related_to=self.related_key) for t in tp]
            graph_client.update_team_permissions(
                permissions=tp,
                related_id=id,
                related_to=self.related_key,
            )

    def _backfill_version(self, id: UUIDStr):
        logger.debug(f"Backfilling {self.related_key} version", id=id)
        ds = self._get_basic(id)
        version = graph_client.insert_version(
            related_to=self.related_key,
            id=id,
            user_id=ds.created_by,
            s3_key=f"configs/{self.related_key}s/{ds.slug}.json",
        ).insert_versions_one
        return version

    def _backfill_private(self, id: UUIDStr, row: dict):
        if self.user.company.everyone_team_id in [t["team_id"] for t in row["team_permissions"]]:
            tp = [t.dict() for t in row["team_permissions"] if t["team_id"] != self.user.company.everyone_team_id]
            tp = [t | dict(related_id=id, related_to=self.related_key) for t in tp]
            graph_client.update_team_permissions(
                permissions=tp,
                related_id=id,
                related_to=self.related_key,
            )


@task(queue_name="tracking")
def async_log_view(user_id: str, related_key: str, index_name: str, recently_viewed_tag_id: UUIDStr, id: UUIDStr):
    graph_client.insert_tag_item_one(
        related_id=id,
        related_to=related_key,
        tag_id=recently_viewed_tag_id,
    )

    # Get current user views from search data
    try:
        current_views = opensearch_client.get(index=index_name, id=id, _source=["user_views"])["_source"].get(
            "user_views", []
        )
    except Exception:
        logger.debug("Error getting current views", id=id, index_name=index_name)
        return None

    # Remove existing entry for this user if present
    current_views = [view for view in current_views if view["user_id"] != user_id]

    # Add new view entry
    current_views.append({"user_id": user_id, "viewed_at": datetime.now().isoformat()})

    # Update search data with new views and last_viewed_at
    opensearch_client.update(
        index_name,
        id,
        body={"doc": {"user_views": current_views, "last_viewed_at": datetime.now().isoformat()}},
    )
    return None
