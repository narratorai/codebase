import re
from typing import Literal

import httpx

from core.api.customer_facing.companies.helpers import create_api_key
from core.api.customer_facing.reports.helpers import get_all_nodes, get_dependencies, run_report
from core.api.customer_facing.reports.models import (
    AppliedFilter,
    CreateReportOutput,
    EachUsedFilter,
    NarrativeGet,
    NarrativeRun,
    RunDetails,
    TextComponents,
    UsedFilter,
)
from core.api.customer_facing.tasks.utils import TaskManager
from core.api.customer_facing.utils.decorator import ensure_company, ensure_mavis
from core.api.customer_facing.utils.pydantic import GraphTask, TeamPermission
from core.decorators.task import task
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.create_narrative import CreateNarrativeNarrative
from core.graph.sync_client.enums import (
    access_role_enum,
    company_task_category_enum,
    narrative_types_enum,
    status_enum,
    tag_relations_enum,
)
from core.graph.sync_client.get_narrative import GetNarrativeNarrativeByPk
from core.logger import get_logger
from core.models.ids import UUIDStr, get_uuid, get_uuid4, to_id
from core.models.time import days_ago, is_same_cron, today, update_cron, utcnow
from core.util.llm import ask_gpt
from core.utils import remove_enums
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import initialize_mavis

from ..utils import BasicHandler, ItemUpdator, QueryBuilder

logger = get_logger()

components_prompt = """
**GOAL:** Read the report given by the user and return the following compoenents:

OUTPUT:
- Summary: A brefief summary of what the report is about.
- Key Takeaways: Review the text and data in the report and share at least 3 takeways for how things are going from the data.

Today is {today}
"""


class BasicNarrativeHandler(BasicHandler):
    @property
    def index_name(self):
        return "narrative"

    @property
    def related_key(self):
        return tag_relations_enum.narrative.value

    @property
    def display_name(self):
        return "report"

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
            "name": {"type": "text"},
            "description": {"type": "text"},
            "attachment_id": {"type": "keyword"},
            "file_extension": {"type": "keyword"},
        }


def _version_to_last_run(report: dict):
    if len(report["compiled_versions"]) == 0:
        return None
    else:
        return dict(
            version_id=report["compiled_versions"][0]["s3_key"].split(".")[0],
            run_key=report["compiled_versions"][0]["s3_key"].split(".")[1],
            created_at=report["compiled_versions"][0]["created_at"],
        )


class NarrativeQueryBuilder(BasicNarrativeHandler, QueryBuilder):
    @property
    def search_fields(self):
        return ["name^8", "description^4"]

    @property
    def filter_fields(self):
        return []

    @property
    def sort_by(self) -> list[tuple]:
        return [("user_views", "desc"), ("created_at", "desc")]

    def get_graph_data(self, ids):
        return graph_client.get_reports(ids=ids).dict()["reports"]

    def combine_search_and_graph_data(self, search_result: dict, graph_data: list[dict] | None):
        report = [r for r in graph_data if r["id"] == search_result["id"]]
        if len(report) == 0:
            return None

        report = report[0]
        search_result["last_run"] = _version_to_last_run(report)

        # Process the scheduled flag
        if report.get("task_id"):
            search_result["scheduled"] = True

        if search_result.get("attachment_id", None) and search_result.get("file_extension", None):
            search_result["screenshot"] = dict(
                attachment_id=search_result["attachment_id"],
                file_extension=search_result["file_extension"],
            )

        return search_result


class NarrativeUpdator(BasicNarrativeHandler, ItemUpdator):
    def _get_basic(self, id: UUIDStr):
        nar = graph_client.get_narrative_basic(id=id).narrative_by_pk
        self.check_company(nar)
        return nar

    def _get_created_by(self, id: UUIDStr):
        return self._get_basic(id).created_by

    def get(self, id: UUIDStr) -> GetNarrativeNarrativeByPk:
        narrative = graph_client.get_narrative(id=id).narrative_by_pk
        self.check_company(narrative)
        return narrative

    def get_search_data(self, id: UUIDStr):
        narrative = self.get(id).dict()
        if narrative["state"] == status_enum.live:
            self._backfill_shared(id, narrative)
        else:
            self._backfill_private(id, narrative)
        return narrative


class NarrativeManager(NarrativeUpdator):
    def _slug_to_id(self, slug: str, create: bool = True) -> UUIDStr:
        logger.debug("Getting narrative by slug", slug=slug)
        ds = graph_client.get_narrative_by_slug(self.user.company_id, slug).narrative
        if len(ds) == 0:
            if create:
                (_, id) = self.create(name=slug, slug=slug, hide_from_index=True)
                self._backfill_version(id)
                return id
            else:
                raise SilenceError(f"Narrative {slug} not found")
        return ds[0].id

    def get_with_content(
        self, id: UUIDStr, version_id: UUIDStr | Literal["latest", "lastRun"] = "latest"
    ) -> NarrativeGet:
        nar = graph_client.get_full_narrative(id=id).narrative_by_pk

        if version_id == "lastRun" and nar.compiled_versions:
            version_id = nar.compiled_versions[0].s3_key.split(".")[0]
        elif version_id in ["latest", "lastRun"]:
            version_id = None

        self.check_company(nar)
        narrative = nar.dict()
        narrative["tag_ids"] = [t.tag_id for t in nar.tags if t.company_tag.user_id is None]
        narrative["datasets"] = [d.dataset.dict() for d in nar.datasets]
        (content, version) = self.get_config(id, version_id, with_version=True)
        narrative["favorited"] = self.user.tags.favorite in [
            t.tag_id for t in nar.tags if t.company_tag.user_id == self.user.id and t.company_tag.tag == "favorite"
        ]
        narrative["version_id"] = version.id
        narrative["last_run"] = _version_to_last_run(narrative)
        narrative["updated_by"] = version.user_id
        narrative["updated_at"] = version.created_at
        # Update the team permissions to be a list of TeamPermission
        narrative["team_permissions"] = [
            TeamPermission(id=tp.team_id, can_edit=tp.can_edit)
            for tp in nar.team_permissions
            if tp.team_id != self.user.company.everyone_team_id
        ]
        narrative["shared_with_everyone"] = any(
            [t for t in nar.team_permissions if t.team_id == self.user.company.everyone_team_id]
        )
        narrative["can_edit"] = self.check_update_permissions(id, True, obj=nar)
        return NarrativeGet(**narrative, content=content)

    @ensure_mavis
    def update_report_config(self, id: UUIDStr, config: dict):
        config["ordered_dependencies"] = get_dependencies(self.mavis, config)
        (is_new, recently_updated_by_id) = self.update_config(id, config)

        if is_new:
            async_resync_image.send(self.company.slug, id)

        return recently_updated_by_id

    def resync_image(self, id: UUIDStr, run_details: RunDetails = None):
        image_content = self.download_report(id, "png", run_details if run_details is not None else RunDetails())
        logger.debug("Got image content")
        attachment_id = get_uuid4()
        self.company.s3.upload_object(image_content, ["media", f"{attachment_id}.png"])
        self.update_search_data(id, dict(attachment_id=attachment_id, file_extension="png"))
        return None

    def check_create_permissions(self):
        self.user.require_role(access_role_enum.create_report)

    def create(
        self, name: str, description: str | None = None, content: dict | None = None, **kwargs
    ) -> CreateNarrativeNarrative:
        narrative = graph_client.create_narrative(
            company_id=self.company.id,
            slug=get_uuid(),  # TODO: remove slugs completely
            name=name,
            description=description,
            type=narrative_types_enum.Story,
            created_by=self.user.id,
        ).narrative

        if narrative is None:
            raise Exception("Narrative not created")
        elif content is not None:
            self.update_report_config(narrative.id, content)

        self.resync_id(narrative.id)
        return narrative

    def update(
        self, id, name: str | None = None, description: str | None = None, content: dict | None = None
    ) -> CreateReportOutput:
        narrative = graph_client.update_narrative(id=id, name=name, description=description).narrative
        self.update_search_data(id, dict(name=name, description=description))
        recently_updated_by_id = None
        if narrative is None:
            raise Exception("Narrative not found")
        elif content is not None:
            recently_updated_by_id = self.update_report_config(narrative.id, content)
        else:
            content = self.get_config(narrative.id)

        return dict(
            id=id,
            name=name or narrative.name,
            description=description or narrative.description,
            content=content,
            notify_overlap_updated_by=recently_updated_by_id,
            updated_by=self.user.id,
            updated_at=utcnow(),
        )

    def update_schedule(self, id: UUIDStr, schedule: str, label: str = None) -> GraphTask:
        nar = graph_client.get_narrative_task(id=id).narrative_by_pk
        task = nar.company_task

        task_updator = TaskManager(user=self.user, company=self.company)

        if task is None:
            from batch_jobs.data_management.run_narrative import run_narrative

            company_task = task_updator.create(
                batch_function=run_narrative,
                kwargs=dict(slug=nar.slug, id=nar.id),
                schedule=update_cron(schedule),
                task_slug="run_narrative",
                label=label or f"Run {nar.name}",
                category=company_task_category_enum.narratives,
            )
        elif not is_same_cron(task.schedule, schedule):
            company_task = task_updator.update_properties(id=nar.company_task.id, schedule=schedule, label=label)

        return company_task

    def delete(self, id):
        graph_client.delete_narrative(id=id)
        self.delete_id(id)

    def get_datasets(self, id: UUIDStr | None = None, config: dict | None = None) -> list[UUIDStr, list[str]]:
        if config is None:
            config = self.get_config(id)

        nodes = get_all_nodes(self.mavis, config["document"]["content"])
        datasets = []
        for node in nodes:
            datasets.extend(node._get_datasets())

        d_ids = list(set([d[0] for d in datasets]))
        # return each dataset and all the tabs used
        all_ds = []
        for d_id in d_ids:
            all_ds.append((d_id, list(set([cd[1] for cd in datasets if cd[0] == d_id]))))
        return all_ds

    @ensure_company
    def download_report(self, id: UUIDStr, format: Literal["pdf", "png"] = "png", run_details: RunDetails = None):
        logger.debug("creating the key")
        # converts the data to an image and uploads to s3
        key_id = get_uuid4()  # Create a key only for format validation purposes
        api_key = create_api_key(
            key_id=key_id,
            user_id=self.user.id,
            company=self.user.company,
            ttl=60 * 60 * 4,  # 4 hour time window
        )  # Use a small TTL since this key cannot be revoked
        url = f"https://portal.narrator.ai/api/{self.user.company.slug}/reports/{id}"
        headers = {"X-API-KEY": api_key, "Accept": "application/pdf" if format == "pdf" else "image/png"}

        # Using httpx to download the PDF
        with httpx.Client() as client:
            params = {"format": format}

            # TODO: Handle the applied filters
            # if run_details:
            #     params.update(run_details.dict())

            logger.debug("generating the file")
            response = client.get(url, headers=headers, params=params, timeout=6000)
            if response.status_code == 200:
                return response.content
            else:
                logger.error(f"Failed to download report: {response.status_code}")

    def get_narrative_as_text(self, id: UUIDStr) -> str:
        config = self.get_config(id)
        self._update_text_with_data(config)
        return config["text"]

    def _update_text_with_data(self, config: dict):
        text = config["document"]["text"]
        # Regex pattern to match the dataset section enclosed within {% dataTable %} and {% enddataTable %}
        dataset_pattern = re.compile(r"{% dataTable %}(.*?)\{% enddataTable %}", re.DOTALL)
        datasets = dataset_pattern.findall(text)
        d_objs = {}

        # Process each dataset entry
        for _, dataset in enumerate(datasets):
            # Extract individual key-value pairs
            key_value_pattern = re.compile(r"{\s*(\w+\.\w+):\s*([^}]+)\s*}")
            key_value_pairs = key_value_pattern.findall(dataset)
            obj = {key: value.strip() if value.strip() != "" else None for key, value in key_value_pairs}

            # convert dataset to content and return the text
            if d_objs.get(obj["dataset.id"]):
                d_objs[obj["dataset.id"]] = Dataset(self.mavis, obj["dataset.id"])

            ds = d_objs[obj["dataset.id"]]
            data = ds.run(obj["dataset.tab.slug"])
            new_text = data.to_markdown()
            # TODO: ADD CONTEXT ON THE PLOT
            text = text.replace(dataset, new_text)

        config["text"] = text
        return config

    def breakdown_content(self, text: str) -> TextComponents:
        return ask_gpt(
            components_prompt.format(today=today()),
            text,
            TextComponents,
        )

    @ensure_mavis
    def run(self, id: UUIDStr):
        # NOTE: This is NOT for applied_filters.  Those should be handled separately with a version if it is scheduled
        (config, version) = self.get_config(id, with_version=True)
        run_details = run_report(self.mavis, id, config, version_id=version.id)
        # update the Narrative Runs
        graph_client.insert_version(
            related_to=tag_relations_enum.narrative_run,
            id=id,
            user_id=self.user.id,
            s3_key=f"{version.id}.{run_details.run_key}",
        )
        return run_details

    def get_runs(self, id: UUIDStr, per_page: int = 10, page: int = 1) -> list[NarrativeRun]:
        offset = (page - 1) * per_page
        data = graph_client.get_versions(
            related_to=tag_relations_enum.narrative_run, id=id, offset=offset, limit=per_page
        ).versions
        return [
            NarrativeRun(
                id=r.id,
                created_at=r.created_at,
                version_id=r.s3_key.split(".")[0],
                run_key=r.s3_key.split(".")[1],
            )
            for r in data
        ]

    @ensure_company
    def get_used_filters(self, id: UUIDStr) -> UsedFilter:
        if views := self.company.s3.get_file(["narratives", "tracking", id, "used_filters.json"]):
            return UsedFilter(**views)
        else:
            return UsedFilter(used_filters=[])

    def update_used_filters(self, id: UUIDStr, applied_filters: list[AppliedFilter]):
        filters = self.get_used_filters(id)
        filt = EachUsedFilter(id=to_id(applied_filters), used_at=utcnow(), filters=applied_filters)
        filters.used_filters = [f for f in filters.used_filters if f.id != filt.id and f.used_at < days_ago(30)]
        filters.used_filters.append(filt)
        return self.company.s3.upload_object(filters.dict(), ["narratives", "tracking", id, "used_filters.json"])

    ##  OLD Narrative CODE
    @ensure_company
    def get_views(self, narrative_slug: str):
        if views := self.company.s3.get_file(["narratives", "tracking", narrative_slug, "view.json"]):
            return views
        else:
            return dict(views={})

    @ensure_company
    def update_views(self, narrative_slug, views):
        # remove all the completed flags
        return self.company.s3.upload_object(views, ["narratives", "tracking", narrative_slug, "view.json"])

    @ensure_company
    def get_images(self):
        if imgs := self.company.s3.get_file(["narratives", "icons.json"]):
            return imgs
        else:
            return dict(images={})

    @ensure_company
    def update_img(self, narrative_id: UUIDStr, img):
        imgs = self.get_images()
        imgs["images"][str(narrative_id)] = str(img)
        # remove all the completed flags
        return self.company.s3.upload_object(imgs, ["narratives", "icons.json"])

    @ensure_company
    def get_snapshot(self, slug: str, key: str):
        return self.company.s3.get_file(["caches", "narratives", slug, "valid", f"{key}.json"])

    @ensure_company
    def upload_snapshot(self, slug: str, narrative_object: dict, override_key: str = None):
        key = override_key or utcnow()
        # log the key
        narrative_object["upload_key"] = key

        return self.company.s3.upload_object(
            remove_enums(narrative_object),
            [
                "caches",
                "narratives",
                slug,
                "valid",
                f"{key}.json",
            ],
        )


@task(queue_name="tracking")
def async_log_filter_use(company_slug: str, applied_filters: list[dict], narrative_id: UUIDStr):
    mavis = initialize_mavis(company_slug)
    NarrativeManager(mavis=mavis).update_used_filters(narrative_id, applied_filters)


@task(queue_name="tracking")
def async_resync_image(company_slug: str, narrative_id: UUIDStr):
    mavis = initialize_mavis(company_slug)
    try:
        NarrativeManager(mavis=mavis).resync_image(narrative_id)
    except Exception as e:
        logger.error(f"Failed to resync image: {e}")
