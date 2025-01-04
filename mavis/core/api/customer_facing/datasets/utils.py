from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core.api.customer_facing.datasets.helpers import parse_details
from core.api.customer_facing.datasets.models import GroupingEnum
from core.api.customer_facing.tasks.utils import TaskManager
from core.api.customer_facing.utils.decorator import ensure_company
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import (
    access_role_enum,
    company_task_category_enum,
    materialization_type_enum,
    status_enum,
    tag_relations_enum,
)
from core.graph.sync_client.get_dataset_materialization import GetDatasetMaterializationMaterialization
from core.graph.sync_client.get_full_dataset import GetFullDatasetDatasetByPk
from core.graph.sync_client.insert_dataset import InsertDatasetInsertDatasetOne
from core.logger import get_logger
from core.models.ids import UUIDStr, get_uuid
from core.utils import list_activities, slugify
from core.v4.dataset_comp.integrations.model import Materialization, MaterializationTypeEnum
from core.v4.dataset_comp.query.model import DatasetObject

from ..utils import BasicHandler, ItemUpdator, QueryBuilder

logger = get_logger()


class BasicDatasetHandler(BasicHandler):
    @property
    def index_name(self):
        return "dataset"

    @property
    def related_key(self):
        return tag_relations_enum.dataset.value

    @property
    def display_name(self):
        return "dataset"

    @property
    def use_semantic_search(self):
        return True

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            "team_ids": {"type": "keyword"},
            "user_id": {"type": "keyword"},
            # Fields Used for sorting
            "favorited_by": {"type": "keyword"},
            "tag_ids": {"type": "keyword"},
            "created_at": {"type": "date"},
            "user_views": {
                "type": "nested",
                "properties": {
                    "user_id": {"type": "keyword"},
                    "viewed_at": {"type": "date"},
                },
            },
            # Fields Used for Search
            "slug": {"type": "keyword"},  # TODO: Remove this
            "name": {"type": "text"},
            "description": {"type": "text"},
            "table_id": {"type": "keyword"},
            "activities": {"type": "keyword"},
            "integration_types": {"type": "keyword"},
            "locked": {"type": "boolean"},
            "has_training": {"type": "boolean"},
            "dependents": {"type": "text"},
        }


class DatasetQueryBuilder(BasicDatasetHandler, QueryBuilder):
    def __init__(
        self,
        *,
        grouping: GroupingEnum | None = None,  # Add this parameter
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.grouping = grouping  # Store it as instance variable
        self._sort_by = [("user_views", "desc"), ("created_at", "desc")]

    @property
    def search_fields(self):
        return ["name^8", "description^4", "integration_types", "dependents"]

    @property
    def filter_fields(self):
        return [
            "table_id",
            "activities",
            "locked",
            "integration_types",
            "has_training",
            "grouping",
            "is_shared_with_everyone",
        ]

    @property
    def sort_by(self) -> list[tuple]:
        return self._sort_by

    def _get_integration_types(self, grouping: GroupingEnum) -> list[str]:
        if grouping == GroupingEnum.activated_data:
            return [
                materialization_type_enum.klaviyo.value,
                materialization_type_enum.sendgrid.value,
                materialization_type_enum.text.value,
                materialization_type_enum.clearfind_software_match.value,
                materialization_type_enum.postmark.value,
                materialization_type_enum.webhook.value,
            ]
        elif grouping == GroupingEnum.exported_data:
            return [
                materialization_type_enum.csv.value,
                materialization_type_enum.materialized_view.value,
                materialization_type_enum.gsheets.value,
            ]
        return []

    def pre_process_filters(self):
        if self.grouping:
            if self.grouping in (
                GroupingEnum.recently_viewed_by_team,
                GroupingEnum.top_viewed_by_team,
                GroupingEnum.top_favorited_by_team,
            ):
                self.filters["team_ids"] = self.user.team_ids
                if self.grouping == GroupingEnum.recently_viewed_by_team:
                    self._sort_by = [("last_viewed_by_anyone_at", "desc")]
                elif self.grouping == GroupingEnum.top_viewed_by_team:
                    self._sort_by = [("total_user_views", "desc")]
                elif self.grouping == GroupingEnum.top_favorited_by_team:
                    self._sort_by = [("total_favorites", "desc")]

            elif self.grouping == GroupingEnum.activated_data:
                self.filters["integration_types"] = self._get_integration_types(self.grouping)
            elif self.grouping == GroupingEnum.exported_data:
                self.filters["integration_types"] = self._get_integration_types(self.grouping)

        return None

    def combine_search_and_graph_data(self, search_result: dict, graph_data: list[dict] | None):
        if self.grouping == GroupingEnum.recently_viewed:
            if search_result.get("last_viewed_at") is None:
                return None
        elif self.grouping == GroupingEnum.recently_viewed_by_team:
            if search_result.get("last_viewed_by_anyone_at") is None:
                return None

        search_result["locked"] = search_result.get("locked") or False

        # keep track of all the fields
        for k in ["integration_types", "dependents", "activities"]:
            if search_result.get(k) is None:
                search_result[k] = []

        return search_result


class DatasetUpdator(BasicDatasetHandler, ItemUpdator):
    def _get_basic(self, id: UUIDStr):
        result = graph_client.get_dataset_basic(id=id)
        if result is None:
            raise SilenceError(f"Dataset {id} not found")
        ds = result.dataset_by_pk
        self.check_company(ds)
        return ds

    def _get_created_by(self, id: UUIDStr):
        return self._get_basic(id).created_by

    def get(self, id: UUIDStr) -> GetFullDatasetDatasetByPk:
        ds = graph_client.get_full_dataset(id=id).dataset_by_pk
        self.check_company(ds)
        return ds

    def get_search_data(self, id: UUIDStr):
        row = self.get(id)
        if row.hide_from_index or row.status == status_enum.archived:
            return None

        dependents = []
        dependents.extend([r.label for r in row.materializations])
        dependents.extend([r.narrative.name for r in row.dependent_narratives])

        # TODO: Add the plots, DatasetKind, groups, etc.
        output_row = dict(
            **row.dict(),
            table_id=next((a.activity.table_id for a in row.dataset_activities), None),
            activities=[a.activity.id for a in row.dataset_activities],
            integration_types=list(set([d.type for d in row.materializations])),
        )

        if row.status == status_enum.live:
            self._backfill_shared(id, output_row)
        elif row.status == status_enum.in_progress:
            self._backfill_private(id, output_row)

        return output_row


class DatasetManager(DatasetUpdator):
    def _slug_to_id(self, slug: str, create: bool = True) -> UUIDStr:
        logger.debug("Getting dataset by slug", slug=slug)
        ds = graph_client.get_datasets_by_slug(self.user.company_id, [slug]).dataset
        if len(ds) == 0:
            if create:
                (_, id) = self.create(name=slug, slug=slug, hide_from_index=True)
                self._backfill_version(id)
                logger.debug("found dataset id", id=id)
                return id
            else:
                raise SilenceError(f"Dataset {slug} not found")
        logger.debug("found dataset id", id=ds[0].id)
        return ds[0].id

    @ensure_company
    def update_dataset_config(self, id: UUIDStr, config: DatasetObject | dict):
        (is_new, recently_updated_by_id) = self.update_config(id, config)
        if is_new:
            if isinstance(config, dict):
                activity_ids = list(list_activities(config["query"]).keys())
            elif isinstance(config, DatasetObject):
                activity_ids = config.activity_ids
            else:
                raise SilenceError("Invalid config type")

            try:
                # update the dataset relations
                res = graph_client.update_dataset_relations(
                    dataset_id=id,
                    updated_by=self.user.id,
                    activity_ids=activity_ids,
                    activity_inputs=[dict(dataset_id=id, activity_id=a) for a in activity_ids],
                )

                if res.delete_dataset_activities.affected_rows > 0 or res.insert_dataset_activities.affected_rows > 0:
                    self.update_search_data(id, dict(activities=activity_ids))
            except Exception as e:
                logger.error("Error updating dataset relations", error=e)

        return recently_updated_by_id

    def override_create(self, id: UUIDStr, created_by: UUIDStr):
        graph_client.update_dataset_created_by(id=id, created_by=created_by)
        self._update_created_by(id, created_by)
        return None

    def duplicate(self, id: UUIDStr, new_name: str) -> InsertDatasetInsertDatasetOne:
        dataset = self.create(
            name=new_name,
        )
        self.update_dataset_config(dataset.id, self.get_config(id))
        return dataset

    def create(
        self,
        name: str = None,
        description: str | None = None,
        tags: list[UUIDStr] = None,
        hide_from_index: bool = False,
        locked: bool = False,
        **kwargs,
    ) -> InsertDatasetInsertDatasetOne:
        self.user.require_role(access_role_enum.create_dataset)

        if kwargs.get("slug"):
            slug = kwargs["slug"]
        else:
            slug = f"{slugify(name)}_{get_uuid()[:8]}"

        logger.debug("Creating dataset", name=slug)
        dataset = graph_client.insert_dataset(
            company_id=self.company.id,
            created_by=self.user.id,
            updated_by=self.user.id,
            name=name,
            slug=slug,
            description=description,
            hide_from_index=hide_from_index or False,
            locked=locked or False,
            # has_training=has_training,
        ).insert_dataset_one

        # create all the datasets
        for t in tags or []:
            graph_client.insert_tag_item_one(related_to="dataset", related_id=dataset.id, tag_id=t)

        self.log_view(dataset.id)

        if kwargs.get("status") == status_enum.live:
            # always update the status
            graph_client.update_datasetstatus(id=dataset.id, status=kwargs.get("status"))

        self.resync_id(dataset.id)
        return dataset

    def update(
        self,
        id: UUIDStr,
        name: str = None,
        description: str | None = None,
        hide_from_index: bool = False,
        locked: bool = False,
        **kwargs,
    ):
        graph_client.update_dataset(
            id=id,
            name=name,
            description=description,
            hide_from_index=hide_from_index,
            locked=locked,
        )

        if hide_from_index:
            self.delete_id(id)
        else:
            self.update_search_data(id, {"name": name, "description": description, "locked": locked}, vectorize=True)

    def delete(self, id: UUIDStr):
        dataset = graph_client.get_dataset_basic(id=id).dataset_by_pk
        if dataset.locked:
            raise SilenceError("Cannot delete a locked datasets.  Please unlock it to delete")

        mats = graph_client.get_dataset_materializations(dataset_id=id).materializations
        graph_client.delete_dataset(id=id)
        for mat in mats:
            self.delete_materialization(mat.id)

        self.delete_id(id)

    @ensure_company
    def _get_materialization(self, id: str):
        return self.company.s3.get_file(["configs", "materialization", f"{id}.json"])

    @ensure_company
    def _update_materialization(self, materialization_id: str, config: dict):
        return self.company.s3.upload_object(config, ["configs", "materialization", f"{materialization_id}.json"])

    def get_materialization(self, materialization_id: UUIDStr) -> Materialization:
        mat = graph_client.get_dataset_materialization(id=materialization_id).materialization
        config = self._get_materialization(materialization_id)
        materialization = self.convert_old_materialization(mat, config)

        # copy the key attributes
        materialization.id = mat.id
        materialization.task_id = mat.task_id
        materialization.task_schedule = mat.company_task.schedule
        materialization.dataset_id = mat.dataset_id
        materialization.tab_slug = mat.group_slug
        return materialization

    def _external_link(self, mat: Materialization) -> str | None:
        if mat.type == MaterializationTypeEnum.webhook:
            return mat.details.webhook.url
        elif mat.type == MaterializationTypeEnum.gsheets:
            return f"https://docs.google.com/spreadsheets/d/{mat.details.sheet_key}"
        return None

    def api_mat_to_materialization(self, id: UUIDStr, mat: dict) -> Materialization:
        if "cron" in mat:
            mat["schedule"] = mat["cron"]
        elif "company_task" in mat:
            mat["schedule"] = mat["company_task"]["schedule"]
        else:
            mat["schedule"] = "1 1 1 1 1"

        return Materialization(
            id=mat.get("id"),
            label=mat["label"],
            dataset_id=id,
            tab_slug=mat["group_slug"],
            type=mat["type"],
            ai_prompt=mat.get("ai_prompt"),
            details=parse_details(mat["type"], mat),
            task_schedule=mat["schedule"],
        )

    def convert_old_materialization(
        self, mat: GetDatasetMaterializationMaterialization, config: dict
    ) -> Materialization:
        current_type = (
            mat.type if mat.type != materialization_type_enum.clearfind_software_match else config.get("type")
        )
        return Materialization(
            id=None,
            label=mat.label,
            dataset_id=mat.dataset_id,
            tab_slug=mat.group_slug,
            type=current_type,
            ai_prompt=config.get("ai_prompt"),
            details=parse_details(current_type, config),
            task_schedule=mat.company_task.schedule,
            task_id=mat.task_id,
        )

    def update_dependents(
        self,
        id: UUIDStr,
        remove_dependents: list[str] | None = None,
        add_dependents: list[str] | None = None,
        add_type: str | None = None,
        remove_type: str | None = None,
    ):
        if remove_dependents is None:
            remove_dependents = []
        if add_dependents is None:
            add_dependents = []

        # handle the dependents
        row = self.get_index_row(id, ["dependents", "integration_types"])
        if row.get("dependents") is None:
            row["dependents"] = []
        row["dependents"] = [r for r in row["dependents"] if r not in remove_dependents]
        row["dependents"].extend(add_dependents)

        # handle the types
        if row.get("integration_types") is None:
            row["integration_types"] = []
        if add_type:
            row["integration_types"].append(add_type)
        if remove_type:
            row["integration_types"] = [r for r in row["integration_types"] if r != remove_type]
        self.update_search_data(id, row)

    def create_materialization(self, id: UUIDStr, mat: Materialization) -> Materialization:
        if mat.type in (MaterializationTypeEnum.materialized_view, MaterializationTypeEnum.view):
            self.user.require_role(access_role_enum.create_dataset_materialize_view)
        else:
            self.user.require_role(access_role_enum.create_dataset_integeration)

        mat_id = graph_client.insert_dataset_materialization(
            updated_by=self.user.id,
            type=mat.type,
            group_slug=mat.tab_slug,
            dataset_id=id,
            label=mat.label,
            external_link=self._external_link(mat),
        ).inserted_dataset_materialization.id
        mat.id = mat_id

        # create the task
        from batch_jobs.data_management.materialize_dataset import materialize_dataset

        mat.task_id = (
            TaskManager(company=self.company)
            .create(
                materialize_dataset,
                schedule=mat.task_schedule,
                task_slug=f'm_{"mv" if mat.type == MaterializationTypeEnum.materialized_view else mat.type}_{slugify(mat.label)}_{get_uuid()[:8]}',
                label=mat.label,
                category=company_task_category_enum.materializations.value,
                update_db_table="dataset_materialization",
                update_db_id=mat_id,
                task_fields=dict(materialization_id=mat_id),
            )
            .id
        )
        # update the search data
        self.update_dependents(id, add_dependents=[mat.label], add_type=mat.type)

        return mat

    def update_materialization(self, mat: Materialization) -> Materialization:
        if mat.type == MaterializationTypeEnum.clearfind_evaluate_software:
            return mat

        graph_client.update_dataset_materialization(
            id=mat.id,
            updated_by=self.user.id,
            type=mat.type,
            label=mat.label,
            group_slug=mat.tab_slug,
            external_link=self._external_link(mat),
        )
        mat_obj = graph_client.get_dataset_materialization(id=mat.id).materialization

        if mat_obj.company_task.schedule != mat.task_schedule:
            TaskManager(company=self.company).update_properties(
                mat_obj.task_id,
                mat.task_schedule,
                label=mat.label,
            )
        mat.task_id = mat_obj.task_id

        # update the search data
        self.update_dependents(mat.dataset_id, remove_dependents=[mat_obj.label], add_dependents=[mat.label])
        return mat

    def delete_materialization(self, mat_id: UUIDStr, task_id: UUIDStr) -> None:
        mat = graph_client.delete_materialization(mat_id).delete_dataset_materialization_by_pk
        if mat.task_id is not None:
            TaskManager(company=self.company).delete(mat.task_id)

        self.update_dependents(mat.dataset_id, remove_dependents=[mat.label], remove_type=mat.type)

    def trigger_materialization(self, mat: Materialization, resync: bool = False) -> None:
        if resync and mat.id is not None and mat.type == MaterializationTypeEnum.materialized_view:
            ts = CustomTask(self.company.s3, TaskKindEnum.materialization, mat.id)
            ts.add_task("resync")
            ts.update()

        from batch_jobs.data_management.materialize_dataset import materialize_dataset

        # trigger the run
        materialize_dataset.send(
            company_slug=self.user.company.slug,
            materialization_id=mat.id if mat.id is not None else None,
            materialization_attrs=mat.dict() if mat.id is None else None,
            task_id=mat.task_id,
        )
