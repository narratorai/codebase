"""Updates the activity stream."""

import json
import time
from collections import defaultdict
from collections.abc import Callable, Coroutine
from copy import deepcopy
from time import sleep
from typing import Any

from dramatiq.middleware import Shutdown, TimeLimitExceeded
from dramatiq_abort.abort_manager import Abort
from opentelemetry.trace import get_current_span
from pydantic import BaseModel
from sentry_sdk.crons.decorator import monitor as sentry_monitor
from toposort import CircularDependencyError

from batch_jobs.custom_task import CustomTask, TaskKindEnum
from batch_jobs.data_management.clean_tables import run_clean
from core import flags, utils
from core.api.customer_facing.activities.utils import ActivityManager
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.sql.utils import WarehouseManager
from core.api.customer_facing.tables.utils import TableManager
from core.api.customer_facing.transformations.utils import TransformationManager
from core.api.v1.narrative.helpers import update_narrative
from core.api.v1.narrative.models import NarrativeUpdateInput
from core.constants import (
    ALL_TEMPORAL_JOIN_EMAIL_TEMPLATE,
    ALL_TEMPORAL_JOIN_TEMPLATES,
    DEFAULT_DAYS,
    END_TIME,
    ENRICHED_ID_COLS,
    ENRICHED_TS_COLS,
    INTERNAL_EMAIL_TEMPLATE,
    MAX_INT,
    NARRATIVE_ADDED_EMAIL_TEMPLATE,
    PROCESS_TRACKING_FIVETRAN_URL,
    START_TIME,
    TRANSFORMATION_UP_TO_DATE_EMAIL_TEMPLATE,
)
from core.decorators import mutex_task, with_mavis
from core.errors import (
    ConnectionError,
    QueryRunError,
    RunTransformationError,
    SilenceError,
    WarehouseRandomError,
)
from core.graph import graph_client
from core.graph.sync_client.enums import (
    access_role_enum,
    maintenance_kinds_enum,
    status_enum,
    transformation_kinds_enum,
    transformation_update_types_enum,
)
from core.logger import get_logger
from core.models.ids import is_valid_uuid
from core.models.internal_link import InternalLink
from core.models.service_limit import ServiceLimit, check_limit
from core.models.warehouse_schema import TableSchema
from core.util.email import send_email
from core.util.opentelemetry import tracer
from core.util.tracking import fivetran_track
from core.v4.analysisGenerator import assemble_narrative
from core.v4.blocks.transformation_tests import _update_column_names
from core.v4.blocks.use_narrative_template_v5 import (
    process_data as template_process_data,
)
from core.v4.dataset_comp.query.model import ActivityColumns
from core.v4.mavis import Mavis

ASYNC_TYPES = (
    transformation_update_types_enum.materialized_view,
    transformation_update_types_enum.mutable,
)
logger = get_logger()


class Activity(BaseModel):
    id: str
    slug: str
    name: str
    row_count: int | None = None
    maintenance_id: str | None = None
    maintenance_kind: maintenance_kinds_enum = None
    maintenance_started_at: str | None = None
    maintenance_ended_at: str | None = None
    maintenance_notes: str | None = None
    maintenance_description: str | None = None
    has_source: bool = False
    transformation_ids = []
    transformation_slugs: list[str] = []


class ProcessUpdate(BaseModel):
    transformation_id: str
    name: str
    slug: str
    updated_at: str | None = None
    owner: str | None = None
    rows_inserted: int = 0
    bytes_scanned: int | None = None
    from_sync_time: str | None = None
    to_sync_time: str | None = None
    duration: str | None = None

    # uset to ignore the data
    ignore: bool = False
    drop_and_create: bool = False
    remove_customers: bool | None = None
    has_source: bool | None = None

    # overrides used
    update_type: str | None = None
    apply_mutable_time: bool = False
    next_resync_at: str | None = None

    # used for cleaning
    activity_ids: list[str] = None
    activity_slugs: list[str] = None
    depends_on: list[str] = None
    up_to_date: bool = True

    # add the maintenance
    maintenance_id: str | None = None
    maintenance_kind: maintenance_kinds_enum = None
    maintenance_started_at: str | None = None
    maintenance_ended_at: str | None = None
    maintenance_notes: str | None = None
    maintenance_description: str | None = None


task_load = ["run_transformation", "tasks.json"]


def task_key(t):
    return json.dumps({k: v for k, v in t.items() if k != "id"}, sort_keys=True)


def is_resync(kind):
    return kind and kind in (
        maintenance_kinds_enum.cascade_resynced,
        maintenance_kinds_enum.resynced,
    )


def run_tutorial_narrative(
    mavis: Mavis,
    template_name,
    override_template_email=None,
    skip_email=False,
    force_assemble=False,
):
    # define the slug
    narrative_slug = utils.slugify(template_name)
    # check if it exists
    try:
        if force_assemble:
            # Assemble the Narrative
            assemble_narrative(mavis, narrative_slug, cache_minutes=10000000)

    except Exception:
        templates = graph_client.get_template_by_name(name=template_name).narrative_template

        template = next(
            (t for t in templates if t.local_iteration == 0),
            None,
        )

        # In case the template is deleted
        if template is None:
            logger.debug("Template does not exist")
            return None

        # prepare the data
        data = dict(
            template_id=template.id,
            template_name=template_name,
            override_narrative_slug=narrative_slug,
            step_flow=dict(
                current=1,
            ),
        )

        # Create the questions
        # HACK: We are assuming that the default guessed answers are good enough
        template_process_data(mavis, data, updated_field_slug="step_flow")

        # run the data
        data["step_flow"]["current"] = 2
        template_process_data(mavis, data, updated_field_slug="step_flow")

        # turn the narrative on
        update_narrative(
            mavis,
            NarrativeUpdateInput(
                name=data["narrative_name"],
                narrative_id=data["narrative_id"],
                tags=["tutorial"],
                slug=data["narrative_slug"],
                state="live",
                type="analysis",
            ),
        )

        # Assemble the Narrative
        assemble_narrative(mavis, data["narrative_slug"], cache_minutes=1000000)

        # Let everyone know!
        if not skip_email:
            all_users = graph_client.get_company_users(company_id=mavis.company.id).company_user

            send_email(
                mavis.company,
                [u.user.email for u in all_users if access_role_enum.admin in [r.role for r in u.user_access_roles]],
                override_template_email or NARRATIVE_ADDED_EMAIL_TEMPLATE,
                dict(
                    narrative_slug=data["narrative_slug"],
                    narrative_name=data["narrative_name"],
                    description=template.description,
                ),
                tag="narrative_tutorial_email",
            )
    return narrative_slug


def _get_maintenance(mavis, transform):
    ta = transform.transformation_maintenances
    if len(ta) > 0:
        return {f"maintenance_{k}": v for k, v in ta[0].dict().items()}

    return {}


# used for get query
def _get_source_column(kind):
    if kind in (kind.enrichment, kind.spend):
        return "_enrichment_source"
    elif kind == kind.stream:
        return ActivityColumns.activity_source
    else:
        return "_transformation_source"


class Plan:
    def __init__(self, mavis: Mavis, transforms, table, kind, manually_partition=False):
        self.mavis: Mavis = mavis
        self.table: str = table
        self.kind = kind
        self.require_validate_to_run = False

        # mainly for testing
        self.columns = [c.name for c in transforms[0].column_renames]
        self.stg_columns = [c.name for c in transforms[0].column_renames]

        self.manually_partitioned = manually_partition
        self._action_results = {}
        self.processes: list[ProcessUpdate] = [
            ProcessUpdate(
                transformation_id=t.id,
                name=t.name,
                slug=t.slug,
                updated_at=t.updated_at,
                remove_customers=t.remove_customers,
                has_source=t.has_source,
                next_resync_at=t.next_resync_at,
                update_type=t.update_type.value,
                depends_on=[d.depends_on_transformation_id for d in t.depends_on_transformations],
                activity_ids=[a.activity.id for a in t.activities],
                activity_slugs=[a.activity.slug for a in t.activities],
                # add the maintenance pieces
                **_get_maintenance(mavis, t),
            )
            for t in transforms
        ]
        self.activities: list[Activity] = self.setup_activities(transforms)
        self.started_at = utils.utcnow()
        self.recompute_full_cache = False
        # self.is_async = transforms[0].update_type in ASYNC_TYPES

        # cascade all depends on to resync
        for p in self.processes:
            if self._should_resync(p):
                self.cascade_resync(p, p.name)

    def get_source_column(self):
        return _get_source_column(self.kind)

    def get_ts_column(self):
        return _get_ts_column(self.kind, self.columns)

    def get_id_column(self):
        if self.kind in (self.kind.enrichment, self.kind.spend):
            return utils.find_first_val(self.columns, ENRICHED_ID_COLS) or ENRICHED_ID_COLS[0]
        elif self.kind == self.kind.stream:
            return "activity_id"

    @tracer.start_as_current_span("run_action")
    def run_action(self, func: Callable[..., Coroutine[Any, Any, Any]], *args, **kwargs):
        span = get_current_span()
        name = func.__name__ + kwargs.get("_variation", "")
        span.set_attribute("action_name", name)

        # check if we should run the process
        if name not in self._action_results.keys():
            now = time.time()
            results = func(*args, **{k: v for k, v in kwargs.items() if not k.startswith("_")})
            self._action_results[name] = results

            # log how long the process takes
            fivetran_track(
                self.mavis.user,
                PROCESS_TRACKING_FIVETRAN_URL,
                dict(
                    table=self.table,
                    kind=self.kind.value,
                    manually_partitioned=self.manually_partitioned,
                    process=name,
                    duration=time.time() - now,
                ),
            )
        return self._action_results[name]

    @staticmethod
    def setup_activities(transforms):
        """Order all the activities as a dict."""
        activities = {}
        for t in transforms:
            for ta in t.activities:
                activity = ta.activity
                if activities.get(activity.id) and t.id not in activities[activity.id].transformation_ids:
                    activities[activity.id].transformation_ids.append(t.id)
                    activities[activity.id].transformation_slugs.append(t.slug)

                else:
                    # create the activity with the maintenance
                    activities[activity.id] = Activity(
                        **activity.dict(),
                        transformation_ids=[t.id],
                        transformation_slugs=[t.slug],
                    )
                    _copy_attr(activities[activity.id], activity.activity_maintenances)

                if t.has_source:
                    activities[activity.id].has_source = True

        return list(activities.values())

    def get(self, transform_id) -> ProcessUpdate:
        process = next((p for p in self.processes if p.transformation_id == transform_id), None)
        if not process:
            raise SilenceError(f"Could not find process for transformation id: {transform_id}")
        return process

    def get_activity_processes(self, activity_id):
        return [p for p in self.processes if activity_id in p.activity_ids]

    def get_activity(self, activity_id) -> Activity:
        act = next((a for a in self.activities if a.id == activity_id), None)
        if not act:
            raise SilenceError(f"Could not find activity for id: {activity_id}")
        return act

    def is_in_maintenance(self, transform_id):
        return self.get(transform_id).maintenance_id

    def _is_in_resync_maintenance(self, process):
        return is_resync(process.maintenance_kind)

    def is_resyncing(self):
        for process in self.processes:
            if is_resync(process.maintenance_kind) and not process.up_to_date:
                return True
        return False

    def completed_resync(self, remove_activities):
        for process in self.processes:
            if is_resync(process.maintenance_kind) and not process.up_to_date:
                return False
        return True

    @tracer.start_as_current_span("requires_delete_shared_activity")
    def requires_delete_shared_activity(self, transform_id):
        """
        Check to see if there is a activity associated with the transformation
        where the transformation is not being resynced.
        """
        for a_id in self.get(transform_id).activity_ids:
            logger.info("Loading activity", activity_id=a_id)

            for t_id in self.get_activity(a_id).transformation_ids:
                logger.info("Other transforms", transformation_id=t_id)
                process = self.get(t_id)

                if t_id != transform_id and not self.should_resync(t_id) and process.update_type != "materialized_view":
                    get_current_span().set_attribute("shared_transformation_id", t_id)
                    return True
        return False

    def is_shared_activity(self, transform_id):
        return any(len(self.get_activity(a_id).transformation_ids) > 1 for a_id in self.get(transform_id).activity_ids)

    def get_all_activities(self, transform_id):
        return [self.get_activity(a_id).slug for a_id in self.get(transform_id).activity_ids]

    def update_from_sync_time(self, transform_id, from_sync_time):
        p = self.get(transform_id)
        if not self._should_resync(p) or from_sync_time is None:
            p.from_sync_time = from_sync_time

    def ignore_transformation(self, transform_id):
        self.get(transform_id).ignore = True

    def update_type(self, transform_id, new_type):
        self.get(transform_id).update_type = new_type.value

    def should_resync(self, transform_id):
        p = self.get(transform_id)
        return self._should_resync(p)

    @staticmethod
    def _should_resync(p):
        return p.next_resync_at and p.next_resync_at < utils.utcnow()

    def get_inserted_rows(self):
        return sum(p.rows_inserted for p in self.processes)

    def get_activity_rows(self, activity):
        return sum(pr.rows_inserted for pr in self.processes if pr.transformation_id in activity.transformation_ids)

    def get_min_processed_at(self):
        return self.started_at

    def resync_table(self, transform_id):
        self.get(transform_id).drop_and_create = True

    @tracer.start_as_current_span("cascade_resync")
    def cascade_resync(self, from_process, original_transform_name):
        get_current_span().set_attribute("cascade_transform_id", from_process.transformation_id)

        # handle dependence
        for p in self.processes:
            if (
                from_process.transformation_id != p.transformation_id
                and (from_process.transformation_id in p.depends_on)
                and p.next_resync_at is None
            ):
                p.next_resync_at = START_TIME
                handle_error_with_maintenance(
                    self,
                    maintenance_kinds_enum.cascade_resynced,
                    activity_obj=None,
                    process=p,
                    notes=f"Resync triggered by {original_transform_name}",
                )
                self.cascade_resync(p, original_transform_name)

    def update_transform_run(self, transform_id, duration=0):
        # updating the store
        p = self.get(transform_id)

        # TODO: THIS IS A HACK TO not change type in graph
        # we need to update this to be the proper amount
        p.rows_inserted = min(p.rows_inserted, MAX_INT)

        # THIS IS A SKIP!
        if p.to_sync_time is None:
            return None

        # update the rows inserted to deal with the data
        graph_client.insert_query_update(
            transformation_id=p.transformation_id,
            from_sync_time=p.from_sync_time or START_TIME,
            to_sync_time=p.to_sync_time,
            rows_inserted=p.rows_inserted,
            update_duration=duration,
            update_kind=p.update_type,
        )

        # update the resyncing
        if self._should_resync(p) or p.drop_and_create:
            graph_client.update_transformation_resync(
                transformation_id=p.transformation_id,
                last_resynced_at=utils.utcnow(),
                next_resync_at=None,
            )

            # # this means it resynced the data so we should retrigger the activity index
            for a_id in p.activity_ids:
                activity_updator = ActivityManager(mavis=self.mavis)
                activity_updator.trigger_index(a_id)

    @tracer.start_as_current_span("_update_process_maintenance")
    def _update_process_maintenance(self, process: ProcessUpdate):
        get_current_span().set_attribute("transformation_id", process.transformation_id)
        trans_updator = TransformationManager(mavis=self.mavis)
        activity_updator = ActivityManager(mavis=self.mavis)
        # THIS PROCESS has a maintenance on it and is now up to date
        if process.maintenance_id is not None and process.up_to_date:
            prod_trans = graph_client.get_transformation_for_production(process.transformation_id).transformation

            # handle the edge case where a second push happened after it stated
            if (
                is_resync(process.maintenance_kind)
                and process.maintenance_started_at < prod_trans.production_queries[0].created_at
            ):
                logger.info("A new production query was created after the maintenance started")

                # end it and
                trans_updator.end_maintenance(process.transformation_id)
                return None

            # grab all the updates
            all_updates = graph_client.get_transformation_updates(
                id=process.transformation_id,
                started_at=process.maintenance_started_at,
            ).transformation

            # Do not remove activity maintenance if the activity transforamtion had a query failed and the activity has duplicates
            for a_id in process.activity_ids:
                if (
                    process.maintenance_kind == maintenance_kinds_enum.query_failed
                    and self.get_activity(a_id).maintenance_kind == maintenance_kinds_enum.duplicated_id
                ):
                    continue
                activity_updator.end_maintenance(a_id, skip_email=True)

            trans_updator.end_maintenance(process.transformation_id)
            _copy_attr(process, None)

            # NOTIFY CUSTOMER
            send_email(
                self.mavis.company,
                [process.owner],
                TRANSFORMATION_UP_TO_DATE_EMAIL_TEMPLATE,
                dict(
                    transformation_id=process.transformation_id,
                    transformation_name=process.name,
                    update_summary=f"We updated the transformation over {len(all_updates.query_updates)} inserting {utils.human_format(utils.apply_function('sum', [q.rows_inserted for q in all_updates.query_updates]), 'number')} taking a total of {round((utils.apply_function('sum', [q.update_duration for q in all_updates.query_updates]) or 0) /60)} minutes.",
                ),
                tag="maintenance_email",
            )

    @tracer.start_as_current_span("update_plan_run")
    def update_plan_run(self, remove_activities=None):
        """Handle the end of the sync."""
        logger.debug("updating the plan run")
        if remove_activities is None:
            remove_activities = []

        activity_updator = ActivityManager(mavis=self.mavis)
        dataset_updator = DatasetManager(mavis=self.mavis)

        for process in self.processes:
            self._update_process_maintenance(process)

            # CASCADE TO ALL THE ACTIVITIES
            for a in process.activity_ids:
                current_activity = self.get_activity(a)
                if (
                    current_activity.maintenance_id
                    and all(self.get(t_id).up_to_date for t_id in current_activity.transformation_ids)
                    and current_activity.row_count > 0
                    and current_activity.slug not in remove_activities
                    and current_activity.maintenance_kind != maintenance_kinds_enum.duplicated_id
                ):
                    # This used to work but no longer will work since it we cannot
                    activity_updator.end_maintenance(current_activity.id)
                    _copy_attr(current_activity, None)

                    # Resync all the transformations
                    all_dependencies = graph_client.get_activity_dependencies(id=current_activity.id).activity_by_pk

                    # stop if you cannot find the dependency
                    if all_dependencies is None:
                        continue

                    # rerun all materialization of that activity
                    for d in all_dependencies.datasets:
                        # rerun all the materializations beting used
                        for m in d.dataset.materializations:
                            if m.task_id:
                                mat = dataset_updator.get_materialization(m.id)
                                dataset_updator.trigger_materialization(mat)

                        # process all the Narratives that are being used
                        for n in d.dataset.dependent_narratives:
                            if n.narrative.task_id:
                                from batch_jobs.data_management.run_narrative import (
                                    run_narrative,
                                )

                                run_narrative.send(
                                    company_slug=self.mavis.company.slug,
                                    slug=n.narrative.slug,
                                    task_id=n.narrative.task_id,
                                )

    @tracer.start_as_current_span("dirty_all_activities")
    def dirty_all_activities(self, transform_id):
        handle_error_with_maintenance(
            self,
            maintenance_kinds_enum.resynced,
            activity_obj=None,
            process=self.get(transform_id),
        )


@tracer.start_as_current_span("_process_todo_tasks")
def _process_todo_tasks(
    mavis: Mavis,
    todo_tasks: CustomTask,
    plan: Plan | None = None,
    table=None,
    kind=None,
    current_transforms=None,
    manually_partition=None,
    at_end=False,
):
    production_transform_processsed = []
    for t in todo_tasks.tasks:
        # don't bother with completed tasks
        if t.completed:
            continue
        if t.task == "check_production_push":
            try:
                transform = graph_client.get_transformation_for_processing(
                    t.details["transformation_id"]
                ).transformation
            except Exception:
                logger.info(
                    "Could not find transformation.  Assuming it was deleted",
                    transformation_id=t.details["transformation_id"],
                )
                production_transform_processsed.append(t.details["transformation_id"])
                t.completed = True
                continue

            if (
                transform
                and transform.production_queries
                and transform.column_renames
                and transform.column_renames[0].created_at > transform.production_queries[0].updated_at
                and t.details["transformation_id"] not in production_transform_processsed
            ):
                _update_column_names(
                    plan.mavis,
                    transform,
                    t.details["validate_data_from"],
                    use_prod=True,
                )

                production_transform_processsed.append(t.details["transformation_id"])

            # say it rerun so it can work
            t.completed = True

        elif t.task == "resync_part" and t.details.get("table") == table:
            fivetran_track(mavis.user, data=dict(action="ran_processing_task", task=t.task))
            use_transforms = False

            # update all the processing
            for p in plan.processes:
                if p.transformation_id in (t.details["all_transformations"] or []):
                    p.update_type = "mutable"
                    p.from_sync_time = t.details["from_resync_time"]
                    p.to_sync_time = t.details["to_resync_time"]
                    p.apply_mutable_time = True
                    use_transforms = True

            # delete the data in the stream and for optimization use transforamtions
            if t.details.get("delete_data"):
                trans = (
                    [trans.slug for trans in current_transforms if trans.id in (t.details["all_transformations"] or [])]
                    if use_transforms
                    else None
                )

                all_q = []
                if plan.manually_partitioned:
                    for a in plan.activities:
                        all_q.append(
                            _delete_window(
                                mavis,
                                table,
                                kind,
                                t.details["from_resync_time"],
                                t.details["to_resync_time"],
                                trans,
                                activity=a.slug,
                            )
                        )

                    mavis.batch_run_query(all_q)

                else:
                    q = _delete_window(
                        mavis,
                        table,
                        kind,
                        t.details["from_resync_time"],
                        t.details["to_resync_time"],
                        trans,
                    )
                    mavis.run_query(q)

            # say it rerun so it can work
            t.completed = True

        elif t.task == "delete_recent_updates" and t.details.get("table") == table:
            fivetran_track(mavis.user, data=dict(action="ran_processing_task", task=t.task))
            if plan.manually_partitioned:
                all_q = []
                for a in plan.activities:
                    all_q.append(
                        _delete_window(
                            mavis,
                            table,
                            kind,
                            utils.date_add(utils.utcnow(), "day", -1 * t.details["days"]),
                            utils.date_add(utils.utcnow(), "day", 3),
                            use_run_at=True,
                            activity=a.slug,
                        )
                    )
                # batch delete
                mavis.batch_run_query(all_q)

            else:
                q = _delete_window(
                    mavis,
                    table,
                    kind,
                    utils.date_add(utils.utcnow(), "day", -1 * t.details["days"]),
                    utils.date_add(utils.utcnow(), "day", 3),
                    use_run_at=True,
                )
                mavis.run_query(q)

            # say it rerun so it can work
            t.completed = True

            plan = run_start_transforms(
                mavis,
                kind,
                table,
                current_transforms,
                is_reconcile=False,
                manually_partition=manually_partition,
            )

            # trigger a run afterwards
            val_tasks = CustomTask(mavis.company.s3, TaskKindEnum.validation)

            for a in plan.activities:
                # add the task for all updated activities
                val_tasks.add_task("validate_activity", activity_id=a.id)

            val_tasks.update()
            # trigger the task
            plan.require_validate_to_run = True

        elif t.task == "reset_identity" and t.details.get("table") == table:
            mavis.run_query(mavis.qm.get_drop_table_query(mavis.qm.stream_table(table, is_identity=True, alias="l")))
            t.completed = True

        elif at_end and t.task == "manually_partition":
            activity_stream = mavis.company.table(t.details["table"])
            if t.details["manual_partition"] != activity_stream.manually_partition_activity:
                _update_manually_partitioned_stream_table(mavis, activity_stream, t.details["manual_partition"])
                # update the graph
                TableManager(mavis=mavis).update_partition(
                    id=activity_stream.id,
                    manually_partition_activity=t.details["manual_partition"],
                )
                # reprocess all the views
                all_views = graph_client.get_all_materializations(
                    company_id=mavis.company.id, kind="view"
                ).materializations
                for v in all_views:
                    if v.task_id:
                        from batch_jobs.data_management.materialize_dataset import (
                            materialize_dataset,
                        )

                        materialize_dataset.send(
                            company_slug=mavis.company.slug,
                            materialization_id=v.id,
                            task_id=v.task_id,
                        )

            # update it if it is the same
            t.completed = True

        elif t.task == "run_narrative_template":
            # check to make sure the maintenance is not running
            if t.details.get("activity_id"):
                activity_maintenance = graph_client.get_active_maintenance(
                    ids=[t.details["activity_id"]], last_updated_at=utils.utcnow()
                ).activity_maintenance

                if activity_maintenance:
                    continue

            # add a check to require dataset and a group
            if t.details.get("require_datasets"):
                all_datasets = graph_client.dataset_index(mavis.company.id).dataset

                # Make sure we have at lease 2 datasets
                if len(all_datasets) < 3:
                    continue

                no_groups = True
                dataset_updator = DatasetManager(mavis=mavis)
                for d in all_datasets:
                    d_obj = dataset_updator.get_config(d.id)
                    if len(d_obj["query"]["all_groups"]) > 0:
                        no_groups = False
                        break

                # don't run if no groups
                if no_groups:
                    continue

            # Run this template
            try:
                run_tutorial_narrative(
                    mavis,
                    t.details["template_name"],
                    override_template_email=t.details.get("override_template_email"),
                    skip_email=t.details.get("skip_email"),
                )

                t.completed = True
            except Exception as e:
                send_email(
                    mavis.company,
                    "support@narrator.ai",
                    INTERNAL_EMAIL_TEMPLATE,
                    dict(
                        process="Running Tutorial Narratives",
                        notes=f"Could not run {t.details['template_name']} with error : {utils.get_error_message(e)}",
                    ),
                )

        elif t.task == "email_about_templates":
            # Get all the narratives
            all_slugs = [utils.slugify(s) for s in ALL_TEMPORAL_JOIN_TEMPLATES]

            # get all the narratives
            all_narratives = graph_client.narrative_index(mavis.company.id).narrative
            current_narratives = [
                n.dict() for n in all_narratives if n.state == status_enum.live and n.slug in all_slugs
            ]

            # if the narratives are all the same then email the user
            if len(current_narratives) == len(all_slugs):
                all_users = graph_client.get_company_users(company_id=mavis.company.id).company_user

                send_email(
                    mavis.company,
                    [
                        u.user.email
                        for u in all_users
                        if access_role_enum.admin in [r.role for r in u.user_access_roles]
                    ],
                    ALL_TEMPORAL_JOIN_EMAIL_TEMPLATE,
                    dict(narratives=current_narratives),
                )
                t.completed = True

        todo_tasks.update()
    return plan


@mutex_task(
    check_args=False,
    time_limit=43_000_000,
    retry_delay=600_000,
    queue_name="transformations",
)
@sentry_monitor(monitor_slug="run-transformations")
@with_mavis
def run_transformations(mavis: Mavis, is_async: bool = False, is_reconcile: bool = False, **kwargs):
    # check the limits
    check_limit(mavis.company.id, ServiceLimit.ROW_LIMIT)

    # get all the tasks
    todo_tasks = CustomTask(mavis.company.s3, kind=TaskKindEnum.run_transformation)

    production_transformations = [
        t
        for t in graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations
        if t.production_queries_aggregate.aggregate.count > 0
    ]

    # Handle Depends on if it is not part of the same schedule
    for t in production_transformations:
        if t.next_resync_at and t.next_resync_at < utils.utcnow():
            for dt in production_transformations:
                if (
                    dt.task_id != t.task_id
                    and dt.next_resync_at is None
                    and dt.id in [dtt.depends_on_transformation_id for dtt in t.depends_on_transformations]
                ):
                    graph_client.update_next_resync(transformation_id=dt.id, next_resync_at=utils.utcnow())

    # get all the transformations
    transformations = [
        t
        for t in production_transformations
        if (is_reconcile or kwargs.get("task_id") is None or t.task_id == kwargs.get("task_id"))
    ]

    # detect if it is an async run
    is_resync_run = False
    for t in transformations:
        for tm in t.transformation_maintenances:
            if is_resync(tm.kind):
                is_resync_run = True
                break

    # create the remove customers
    remove_customers = defaultdict(list)
    for t in transformations:
        if t.remove_customers:
            remove_customers[t.table].append(t)

    if kwargs.get("task_id") is None:
        transformations = _get_transformations_to_run(transformations, is_async)

    require_validate_to_run = False
    # initialize all the variables
    has_any_resync = False
    run_clean = False

    for kind in (
        transformation_kinds_enum.customer_attribute,
        transformation_kinds_enum.stream,
        transformation_kinds_enum.spend,
        transformation_kinds_enum.enrichment,
    ):
        # Process the table
        for table in {t.table for t in transformations if t.kind == kind}:
            # limit the transformation
            current_transforms = [t for t in transformations if t.kind == kind and t.table == table]
            activity_stream = mavis.company.table(table)
            manually_partition = (
                kind == transformation_kinds_enum.stream
                and activity_stream
                and activity_stream.manually_partition_activity
            )

            # prepare all the transformations
            plan = run_start_transforms(
                mavis,
                kind,
                table,
                current_transforms,
                is_reconcile=is_reconcile,
                manually_partition=manually_partition,
                is_resync_run=is_resync_run,
            )
            # override the plan for resyncing
            if not is_reconcile:
                plan = _process_todo_tasks(
                    mavis,
                    todo_tasks,
                    plan,
                    table,
                    kind,
                    current_transforms,
                    manually_partition,
                )

            try:
                # handle the dependency
                current_transforms = utils.sort_by_dependency(
                    current_transforms,
                    "run_after_transformations",
                    "run_after_transformation_id",
                )

            except CircularDependencyError as e:
                t_names = {t.id: t.name for t in current_transforms}
                k = list(e.keys())[0]

                raise SilenceError(
                    f"The transformation `{t_names[k]}` is set to **run after** `{t_names[list(e.data[k])[0]]}` which is set to run after `{t_names[k]}`  which is causing a circular dependency.  Please remove one of these **run_after**!"
                )

            # process all the deletes
            for t in current_transforms:
                # delete the script
                if not plan.get(t.id).ignore and plan.should_resync(t.id) and t.update_type != t.update_type.view:
                    transform = graph_client.get_transformation_for_processing(id=t.id).transformation
                    _delete_transformation(plan, transform)

            # process all the data
            for t in current_transforms:
                if plan.get(t.id).ignore:
                    continue

                try:
                    logger.debug("running the script")
                    run_script(plan, t.id)
                except (Shutdown, Abort, TimeLimitExceeded):
                    raise
                except ConnectionError:
                    pass
                except Exception as e:
                    _debug_run_error(plan, t.id, e)
            try:
                in_resync = run_end_transforms_v2(
                    plan,
                    kind,
                    table,
                    current_transforms,
                    remove_customers,
                    is_reconcile=is_reconcile,
                )

                # keep track of any resync
                has_any_resync = has_any_resync or in_resync

            except (Shutdown, Abort, TimeLimitExceeded):
                raise
            except ConnectionError:
                pass
            except Exception as e:
                _debug_end_transform_error(
                    plan,
                    kind,
                    table,
                    current_transforms,
                    remove_customers,
                    e,
                    is_reconcile=is_reconcile,
                )

            require_validate_to_run = require_validate_to_run or plan.require_validate_to_run

    # Do the end task without a plan or anything
    _process_todo_tasks(mavis, todo_tasks, at_end=True)

    # handle the resyncing
    check_and_reun_transformations(mavis)

    # remove and update all the tasks that are completed
    todo_tasks.update()

    # trigger the data diagnostics
    if require_validate_to_run:
        from batch_jobs.data_management.validate_stream_assumptions import (
            validate_stream_assumptions,
        )

        validate_stream_assumptions.send_with_options(
            kwargs=dict(
                company_slug=mavis.company.slug,
                task_id=mavis.company.get_task_id("run_data_diagnostics"),
            ),
            delay=10_000,
        )

    if run_clean:
        from batch_jobs.data_management.clean_tables import clean_tables

        clean_tables.send_with_options(
            kwargs=dict(
                company_slug=mavis.company.slug,
                task_id=mavis.company.get_task_id("vacuum_tables"),
            ),
            delay=10_000,
        )


@tracer.start_as_current_span("clean_stg_table")
def _clean_stg_tables(
    mavis: Mavis,
    table: str,
    kind,
    is_staging=False,
    is_identity=False,
    force_drop=False,
    add_condition=None,
):
    # CREATE THE stg table if it doesn't exist
    base_table = mavis.qm.stream_table(table, alias="l")
    stg_table = mavis.qm.stream_table(table, is_staging=is_staging, is_identity=is_identity, alias="l")

    # force the drop if it is not stream
    if force_drop and kind != kind.stream:
        mavis.run_query(mavis.qm.get_drop_table_query(stg_table))

    # Try and clear staging
    try:
        if add_condition:
            mavis.run_query(mavis.qm.get_delete_query(stg_table, add_condition))
        else:
            mavis.run_query(mavis.qm.get_clear_table_query(stg_table))
    except QueryRunError as e:
        # if the _stg doesn't exist, then try to create it
        table_missing = _check_table_missing(mavis, stg_table.table, str(e))

        if not table_missing:
            raise e
        if kind == kind.stream:
            _create_activity_stream(mavis, stg_table.table, no_add_onds=True)
        else:
            try:
                mavis.run_query(mavis.qm.get_create_table_like_query(base_table, stg_table))
            except QueryRunError:
                return True

    return False


@tracer.start_as_current_span("run_start_transforms")
def run_start_transforms(
    mavis: Mavis,
    kind,
    table,
    transforms,
    is_reconcile=False,
    manually_partition=False,
    is_resync_run=False,
) -> Plan:
    """
    - Update the transforms with their max_ts
    - Update based on the reconcile hour to mutable
    - if it is a single run and needs to run then great otherwise remove it
    - if it is mutable and needs to be resynced then it is just regular
    - Update the transform with their next resynced at if it there is a depends on
    """
    span = get_current_span()
    span.set_attributes({"table": table, "kind": kind})

    # create the plan
    plan = Plan(mavis, transforms, table, kind, manually_partition)

    # IF you are resyncing don't bother running anything that is not resyncing
    if is_resync_run:
        for p in plan.processes:
            if not (plan.should_resync(p.transformation_id) or plan._is_in_resync_maintenance(p)):
                logger.debug("ignoring cause we are in a resync", id=p.transformation_id)
                plan.ignore_transformation(p.transformation_id)

    from_sync_times = {}
    # make sure its not a view and their are a ts column
    if (
        kind in (kind.stream, kind.enrichment, kind.spend)
        and plan.get_ts_column()
        and any(p for p in plan.processes if p.update_type != "view")
    ):
        # try removing staging data multiple times
        for _ in range(3):
            # CREATE THE stg table if it doesn't exist
            failed = _clean_stg_tables(mavis, table, kind, is_staging=True)

            # handle dropping anything that didn't exist
            if failed:
                if kind != kind.stream:
                    for p in plan.processes:
                        p.drop_and_create = True
                else:
                    raise SilenceError("Failed to delete the staging table")

            # check to make sure the statging table is empty
            stg_table = mavis.qm.stream_table(table, is_staging=True)
            try:
                data = mavis.run_query(mavis.qm.get_count_query(stg_table).to_query())
            except QueryRunError as e:
                if _check_table_missing(mavis, stg_table.table, str(e)):
                    data = None
                    break
                else:
                    raise e

            # if the table is empty then break
            if data.rows[0]["total_rows"] == 0:
                break

            sleep(10)

        # check to make sure the statging table is empty
        if data and data.rows[0]["total_rows"] > 0:
            raise SilenceError("Staging table is not empty ")

        # make sure we even have a ts column
        all_qs = []
        all_activities: list[Activity] = []
        if manually_partition:
            for p in plan.activities:
                if any(not plan.get(t).ignore for t in p.transformation_ids):
                    all_qs.append(_get_last_run_at(plan, activity=p.slug))
                    all_activities.append(p)
        elif any(not p.ignore for p in plan.processes):
            all_qs.append(_get_last_run_at(plan))

        (errors, results) = mavis.batch_run_query(all_qs, raise_on_error=False)

        for data in results.values():
            # add the max date for each activity
            for r in data.rows:
                source = r[plan.get_source_column()]
                if from_sync_times.get(source) is None or from_sync_times.get(source) < r["max_ts"]:
                    from_sync_times[source] = r["max_ts"]

        for e in errors:
            if not isinstance(e, dict):
                raise ValueError(f"Invalid error format with error {str(e)}")

            if isinstance(e.get("error"), WarehouseRandomError) or "WarehouseRandomError" in e.get("error"):
                sleep(5)
                # rerun the query
                data = mavis.run_query(e["query"])
                for r in data.rows:
                    source = r[plan.get_source_column()]
                    if from_sync_times.get(source) is None or from_sync_times.get(source) < r["max_ts"]:
                        from_sync_times[source] = r["max_ts"]

            elif kind == kind.stream:
                try:
                    if manually_partition:
                        if e["idx"] >= len(all_activities):
                            raise ValueError(f"Invalid index {e['idx']} for activities")
                        activity = all_activities[e["idx"]]
                        st_table = mavis.qm.stream_table(table, activity=activity.slug)
                        # create the missing table
                        _create_activity_stream(mavis, st_table.table, plan.manually_partitioned)
                    else:
                        _create_activity_stream(mavis, table, plan.manually_partitioned)
                except QueryRunError:
                    raise SilenceError(e["error"])
            else:
                # if a materialization fails, then put it in maintenance
                handle_error_with_maintenance(
                    plan,
                    maintenance_kinds_enum.query_failed,
                    activity_obj=None,
                    process=plan.processes[0],
                    error=e["error"],
                    notes=None,
                    email_override=None,
                )

    # loop through the transformation
    for t in transforms:
        # # USE FOR DEBUGGING
        # if t.id != "0c3b0649-4eee-4f9f-863a-4a774674b532":
        #     plan.ignore_transformation(t.id)

        # update the sync time
        plan.update_from_sync_time(t.id, from_sync_times.get(t.slug))
        process = plan.get(t.id)

        # if nothing is in production then don't use it
        if t.production_queries_aggregate.aggregate.count == 0:
            plan.ignore_transformation(t.id)
            logger.debug("Ignore transformation not in production", id=t.id)

        elif process.update_type == "view":
            if plan.should_resync(t.id) or is_resync(process.maintenance_kind):
                plan.resync_table(t.id)
            else:
                logger.debug("Ignore View not needed to resync", id=t.id)
                plan.ignore_transformation(t.id)

        # if it a reconciliation run then make all the update mutable
        elif is_reconcile and process.from_sync_time:
            # set the nightly diff to be true
            process.apply_mutable_time = True
            process.to_sync_time = process.from_sync_time

            # move the time back the window
            process.from_sync_time = utils.date_add(
                process.from_sync_time or utils.utcnow(),
                "days",
                -1
                * next(
                    el
                    for el in (
                        t.mutable_day_window,
                        mavis.config.mutable_update_window,
                        15,
                    )
                    if el is not None
                ),
            )

            # if the data to diff is less than that is needed don't bother updating it
            if (
                t.update_type != t.update_type.regular
                or process.maintenance_id
                or len(t.query_updates) == 0
                or t.query_updates[0].to_sync_time < process.from_sync_time
            ):
                logger.debug("ignore no updates in data", id=t.id)
                plan.ignore_transformation(t.id)
            else:
                plan.update_type(t.id, t.update_type.mutable)
                process.to_sync_time = t.query_updates[0].to_sync_time

        # if reync
        elif plan.should_resync(t.id) or is_resync(process.maintenance_kind):
            # if its a single run then insert all the data
            if t.update_type in (t.update_type.single_run, t.update_type.mutable):
                plan.update_type(t.id, t.update_type.regular)

        # ignore single runs
        elif t.update_type == t.update_type.single_run and process.from_sync_time:
            logger.debug("ignore single run", id=t.id)
            plan.ignore_transformation(t.id)
    return plan


@tracer.start_as_current_span("_debug_run_error")
def _debug_run_error(plan: Plan, transformation_id, exc: Exception, count=1):
    span = get_current_span()
    span.record_exception(exc)
    logger.debug(
        "Error running the transformation",
        exc=exc,
        transformation_id=transformation_id,
    )
    # putting it here to avoid circular dependency
    from core.v4 import data_debugger

    error_message = utils.get_error_message(exc).lower()

    mavis: Mavis = plan.mavis
    retry = False

    transform = graph_client.get_transformation_for_processing(id=transformation_id).transformation

    if transform is None:
        logger.info("Transformation has been deletedd")
        return None

    if isinstance(exc, WarehouseRandomError):
        # if in maintenance mode wait for a bit and try again
        sleep(count * 60)
        retry = True

    elif "expecting timestamp" in error_message:
        # fix the timestamp column for snowflake
        retry = data_debugger.cast_timestamp(mavis, transform)

    elif " bytes " in error_message:
        retry = data_debugger.debug_bytes_issue(mavis, transform, error_message)
    elif "revenue_impact" in error_message and "but expression is of type" in error_message:
        c = next(
            (c for c in transform.column_renames if c.name == "revenue_impact"),
            None,
        )
        if c:
            graph_client.create_new_column(
                related_to="transformation",
                related_to_id=transform.id,
                name="revenue_impact",
                type="string",
                casting="float",
                label=c.label,
                has_data=True,
            )

        retry = True
    elif (
        "value too long" in error_message
        or "would be truncated" in error_message
        or "which cannot be inserted into column" in error_message
        or "type character varying but expression is" in error_message
        or "expression type does not match column" in error_message
    ):
        if transform.kind == transform.kind.stream:
            retry = data_debugger.debug_casting_issue(mavis, transform)
        elif not plan.get(transform.id).drop_and_create:
            plan.get(transform.id).drop_and_create = True
            retry = True
    # deal with the single flag
    elif "constant expressions are not supported in partition by clauses" in error_message:
        retry = data_debugger.debug_single_activity_flag(mavis, transform)

    # no more rows so update
    elif "no more rows to insert" in error_message:
        plan.ignore_transformation(transform.id)
        graph_client.update_transformation_update_type(
            transformation_id=transform.id,
            update_type=transform.update_type.single_run.value,
        )
        return None

    # resync if something is weird
    elif (
        transform.kind != transform.kind.stream
        and transform.update_type != transform.update_type.mutable
        and isinstance(exc, QueryRunError)
        and count == 1
    ):
        # If this was just dropped, or the table was just dropped by another transformation
        if (
            plan.get(transformation_id).drop_and_create
            or (len(plan.processes) > 1 and any(p.drop_and_create for p in plan.processes))
            or transform.do_not_delete_on_resync
        ):
            # let the user know there is an error
            handle_error_with_maintenance(
                plan,
                maintenance_kinds_enum.query_failed,
                process=plan.get(transform.id),
                error=exc,
            )
            retry = False
        elif plan.get(transform.id).maintenance_kind == maintenance_kinds_enum.query_failed:
            retry = False
        else:
            plan.resync_table(transformation_id)
            retry = True

    else:
        retry = False

    # check and process retries
    if retry and count <= 10:
        try:
            logger.info("Re-running the transformation")
            try:
                _clean_stg_tables(
                    mavis,
                    transform.table,
                    transform.kind,
                    is_staging=True,
                    force_drop=plan.get(transformation_id).drop_and_create,
                    add_condition=mavis.qm.Condition(
                        operator="equal",
                        left=_get_source_column(transform.kind),
                        right=mavis.qm.Column(value=transform.slug),
                    ),
                )
            except Exception as e:
                logger.debug("Error cleaning the staging table", error=e)

            run_script(plan, transform.id)
        except (Shutdown, Abort, TimeLimitExceeded):
            raise
        except Exception as e:
            _debug_run_error(plan, transform.id, e, count=count + 1)

    elif isinstance(exc, QueryRunError):
        plan.get(transform.id).up_to_date = False
        handle_error_with_maintenance(
            plan,
            maintenance_kinds_enum.query_failed,
            process=plan.get(transform.id),
            error=exc,
        )
    else:
        raise RunTransformationError(exc, transformation=transform, retry_count=count)


@tracer.start_as_current_span("fix_columns")
def _fix_columns(plan: Plan, transform):
    # use the validation months that has been configured
    day_diff = -1 * (plan.mavis.config.validation_days or DEFAULT_DAYS)

    # add the test for the updating column names
    validate_data_from = utils.date_add(utils.utcnow(), "days", day_diff)[:10]

    _update_column_names(plan.mavis, transform, validate_data_from, use_prod=True)
    prod_query = transform.production_queries[0]

    # update the prod query
    graph_client.update_sql_query(
        id=prod_query.id,
        sql=prod_query.sql,
        notes=None,
        updated_by=prod_query.updated_by,
    )

    return graph_client.get_transformation_for_processing(id=transform.id).transformation


@tracer.start_as_current_span("run_script")
def run_script(plan: Plan, transformation_id):
    # log the start of the transformation
    transform = graph_client.get_transformation_for_processing(id=transformation_id).transformation

    # log the start of the script
    started_at = utils.utcnow()

    # if the transform was delete then just ignore it
    if transform is None or len(transform.production_queries) == 0:
        return None

    # if you see the columns not right then rerun
    if (
        transform.production_queries
        and transform.column_renames[0].created_at > transform.production_queries[0].updated_at
    ):
        transform = _fix_columns(plan, transform)

    # Update the transformation in case it needs to be resynced
    process = plan.get(transform.id)
    # if process.next_resync_at is None:
    #     process.next_resync_at = transform.next_resync_at

    # send the proper email
    if is_valid_uuid(transform.production_queries[0].updated_by):
        process.owner = graph_client.get_user(transform.production_queries[0].updated_by).user_by_pk.email
    else:
        process.owner = transform.production_queries[0].updated_by

    # last update
    last_update = transform.query_updates[0].to_sync_time if len(transform.query_updates) else None

    get_current_span().set_attributes(
        {
            "transformation_id": transformation_id,
            "slug": transform.slug,
            "update_type": process.update_type,
            "next_resync_at": transform.next_resync_at or "never",
            "kind": transform.kind.value,
            "last_update": last_update or "",
        }
    )

    # get the full transformation
    if process.update_type == transform.update_type.materialized_view.value:
        if transform.kind == transform.kind.stream:
            # add the basic times to deal with min date
            _add_sync_times(plan, transform, just_time=True)

            # delete all the data
            _delete_transformation(plan, transform)

            # insert all the data
            _run_regular_insert(plan, transform)

        else:
            _update_materialized_view(plan, transform)

        # update the system
        plan.update_transform_run(transform.id, utils.date_diff(started_at, utils.utcnow(), "second"))
        plan._update_process_maintenance(plan.get(transform.id))

    elif process.update_type == transform.update_type.view.value:
        processed = _update_view(plan, transform)
        if processed:
            plan.update_transform_run(transform.id, utils.date_diff(started_at, utils.utcnow(), "second"))

    else:
        # get the proper sync time
        _add_sync_times(plan, transform)

        if not plan.should_resync(transformation_id) and transform.delete_window:
            _delete_transformation(plan, transform, days=transform.delete_window)

        # Run the data
        if (
            process.update_type == transform.update_type.regular.value
            or process.from_sync_time is None
            or process.drop_and_create
        ):
            _run_regular_insert(plan, transform)
            plan.update_transform_run(transform.id, utils.date_diff(started_at, utils.utcnow(), "second"))

        elif process.update_type == transform.update_type.mutable.value:
            run_mutable_insert(plan, transform)
            plan.update_transform_run(transform.id, utils.date_diff(started_at, utils.utcnow(), "second"))

        # if it ran then turn off the maintenance
        if process.maintenance_kind and process.maintenance_kind == process.maintenance_kind.query_failed:
            plan._update_process_maintenance(plan.get(transform.id))

    process.duration = utils.date_diff(started_at, utils.utcnow(), "second")


@tracer.start_as_current_span("_create_activities")
def _create_activities(mavis: Mavis, transform, activity_slugs, do_not_remove=False):
    details = []
    updated_activities = []
    int_link = InternalLink(mavis.company.slug)

    activity_slugs = [a for a in activity_slugs if a]
    removed_activities = [t.activity for t in transform.activities if t.activity.slug not in activity_slugs]

    # create all the needed activities
    activity_updator = ActivityManager(mavis=mavis)
    for ac in activity_slugs:
        # update the index
        activity_obj = activity_updator.create(
            slug=ac,
            transformation_id=transform.id,
            table_name=transform.table,
        )
        # create or update the activities
        updated_activities.append(activity_obj)
        details.append(
            f" - Created/Updated [{activity_obj.name}]({int_link.activity(activity_obj.id)}) with this transformation"
        )

    # some activity was removed
    if not do_not_remove:
        company_table = mavis.company.table(transform.table)
        for ra in removed_activities:
            _check_and_delete_activity(mavis, transform.id, ra.id, ra.slug, company_table)

    return updated_activities, details


@tracer.start_as_current_span("delete_transformation_process")
def delete_transformation_process(mavis: Mavis, transformation_id):
    actions = []

    transform = graph_client.get_transformation_for_processing(id=transformation_id).transformation

    # if it is not in production, then just delete it and no one cares
    if not transform or not transform.production_queries:
        actions.append("Deleted the transformation")
        return actions

    activity_stream = mavis.company.table(transform.table)
    manually_partition = (
        transform.kind == transform.kind.stream and activity_stream and activity_stream.manually_partition_activity
    )
    transforms = [
        t
        for t in graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations
        if t.production_queries_aggregate.aggregate.count > 0
        and t.kind.value == transform.kind.value
        and t.table == transform.table
    ]

    plan = Plan(mavis, transforms, transform.table, transform.kind, manually_partition)

    # DELETE The transformation
    try:
        _delete_transformation(plan, transform)
    except QueryRunError:
        logger.exception("could not delete table")

    # Check and delete the activities
    if transform.kind == transform.kind.stream:
        for activity_id in plan.get(transform.id).activity_ids:
            _check_and_delete_activity(
                mavis,
                transform.id,
                activity_id,
                plan.get_activity(activity_id).slug,
                activity_stream,
            )

    # check if is is an enrichment and there is only once transformation doing it
    elif plan.processes == 1:
        table = mavis.qm.Table(schema=mavis.company.warehouse_schema, table=transform.table)
        query = mavis.qm.get_drop_table_query(table)
        try:
            mavis.run_query(query)
        except QueryRunError:
            logger.info("Could not delete table")
    return actions


@tracer.start_as_current_span("_check_and_delete_activity")
def _check_and_delete_activity(mavis: Mavis, transformation_id, activity_id, activity_slug, company_table):
    actions = []

    # used to tell other systems if an activity was deltee
    deleted_activity = False

    activity_table_count = graph_client.get_single_activity_table_count(
        activity_id=activity_id
    ).transformation_activities_aggregate
    shared_transform_count = activity_table_count.aggregate.count

    if shared_transform_count == 1:
        # delete the activity
        ActivityManager(mavis=mavis).delete(activity_id)
        deleted_activity = True
        actions.append("Deleted the activity and Archived datasets and Narratives")

        actions.append("Deleted the search index of the activity")
    else:
        graph_client.delete_transformation_activity(transformation_id=transformation_id, activity_id=activity_id)

        if company_table.manually_partition_activity:
            # get the transformation details
            trans = graph_client.get_transformation_simple(transformation_id).transformation

            # get the table
            table = mavis.qm.stream_table(company_table, activity=activity_slug)

            # delete the data from the other table
            try:
                mavis.run_query(
                    mavis.qm.get_delete_query(
                        table,
                        mavis.qm.Condition(
                            operator="equal",
                            left=mavis.qm.Column(table_column=ActivityColumns.activity_source),
                            right=mavis.qm.Column(value=trans.slug),
                        ),
                    )
                )
            except QueryRunError:
                logger.info("Could not delete table")

    return actions, deleted_activity


@tracer.start_as_current_span("_debug_end_transform_error")
def _debug_end_transform_error(plan: Plan, kind, table, transforms, remove_customers, e, is_reconcile=False):
    error_message = utils.get_error_message(e)

    span = get_current_span()
    span.record_exception(e)
    span.set_attribute("error", error_message)

    raise (ValueError(error_message.lower()))


def create_single_row_table(mavis: Mavis, table, qm_column, add_filter=False, make_distinct=True):
    query = mavis.qm.Query()
    if make_distinct:
        query.make_distinct()
    query.add_column(qm_column)
    query.set_from(table)
    if add_filter:
        query.set_where(
            mavis.qm.Condition(
                operator="not_is_null",
                left=qm_column,
            )
        )
    return query


def _wrap_activity_stream(mavis: Mavis, table, **kwargs):
    query = mavis.qm.Query()
    for c in __get_activity_columns(mavis):
        query.add_column(mavis.qm.Column(table_column=c["name"]))
    query.set_from(mavis.qm.stream_table(table, **kwargs))
    return query


@tracer.start_as_current_span("run_end_transforms_v2")
def run_end_transforms_v2(plan: Plan, kind, table, transforms, remove_customers, is_reconcile=False):
    span = get_current_span()
    mavis = plan.mavis
    is_resyning = plan.is_resyncing()

    # if it is all ignore then don't worry about it
    if all(p.ignore for p in plan.processes):
        return is_resyning

    if kind != kind.stream and not any(p for p in plan.processes if p.update_type != "materialized_view"):
        logger.debug("updating the plan")
        plan.update_plan_run()
        return is_resyning

    # Update the plan with all the counts
    no_staging = plan.run_action(_update_process_insert, plan)

    total_rows_inserted = plan.get_inserted_rows()
    span.set_attributes(
        {
            "total_rows_inserted": total_rows_inserted,
            "table": table,
            "kind": kind.value,
        }
    )

    # if no rows then continue
    if total_rows_inserted == 0 and not is_reconcile:
        plan.update_plan_run()
        return is_resyning

    do_not_update_activities = []

    # Insert all the data
    if kind == kind.stream:
        do_not_update_activities = [
            a.slug
            for a in plan.activities
            if a.maintenance_kind
            and a.maintenance_kind == a.maintenance_kind.duplicated_id
            # do not bother failing if any need to be resynced
            and not any(plan.should_resync(t_id) for t_id in a.transformation_ids)
        ]

        only_update_activities = [a.slug for a in plan.activities if a.slug not in do_not_update_activities]

        # handle updating customer
        run_aliasing_on_stg = [t.slug for t in transforms if t.is_aliasing]
        run_aliasing_on_full = [
            p.slug for p in plan.processes if (p.rows_inserted > 0 or is_reconcile) and p.slug in run_aliasing_on_stg
        ]
        # TODO: actually check if anything in stg is also in the old aliasing data

        # prepare identity resolution
        run_identity_on_stg = [t.slug for t in transforms if t.has_source and plan.get(t.id).rows_inserted > 0]
        run_identity_on_full = False

        run_remove_customers_anon_stg = [t.slug for t in remove_customers[table] if t.has_source]
        run_remove_customers_anon_full = [
            p.slug
            for p in plan.processes
            if (p.rows_inserted > 0 or is_reconcile) and p.slug in run_remove_customers_anon_stg
        ]
        # TODO: actually check if anything in stg is also in the remove customer data

        run_remove_customers_stg = [t.slug for t in remove_customers[table]]
        run_remove_customers_full = [
            p.slug
            for p in plan.processes
            if (p.rows_inserted > 0 or is_reconcile) and p.slug in run_remove_customers_stg
        ]
        # TODO: actually check if anything in stg is also in the remove customer data

        # START PROCESSING
        if run_aliasing_on_stg:
            plan.run_action(
                _run_customer_aliasing_v2,
                plan,
                run_aliasing_on_stg,
                on_staging=True,
            )

        if run_identity_on_stg:
            run_identity_on_full = plan.run_action(_prepare_identity_resolution, plan, table)

        if run_remove_customers_anon_stg:
            plan.run_action(
                _run_remove_customers_v2,
                plan,
                run_remove_customers_anon_stg,
                is_anon=True,
                on_staging=True,
                _variation="anon",
            )

        if run_identity_on_stg:
            plan.run_action(
                _run_identity_resolution_v2,
                plan,
                ignore_slugs=run_remove_customers_anon_stg,
                on_staging=True,
            )

        if run_remove_customers_stg:
            plan.run_action(
                _run_remove_customers_v2,
                plan,
                run_remove_customers_stg,
                is_anon=False,
                on_staging=True,
                _variation=ActivityColumns.customer,
            )

    # Insert the data in the proper table
    if not no_staging:
        if plan.manually_partitioned:
            for a in plan.activities:
                if not a.row_count:
                    continue

                update_query = _wrap_activity_stream(mavis, table, is_staging=True)

                update_query.add_filter(
                    mavis.qm.Condition(
                        operator="equal",
                        left=mavis.qm.Column(table_column=ActivityColumns.activity),
                        right=mavis.qm.Column(value=a.slug),
                    )
                )
                activity_table = mavis.qm.stream_table(table, activity=a.slug)
                try:
                    plan.run_action(
                        mavis.run_query,
                        mavis.qm.get_insert_query(activity_table, update_query),
                        _variation=f"insert_from_stg||{a.slug}",
                    )
                    sleep(1)
                except QueryRunError as e:
                    # the table does not exist then create it and rerun
                    table_missing = _check_table_missing(mavis, activity_table.table, e)
                    if table_missing:
                        # create stream
                        _create_activity_stream(
                            mavis,
                            activity_table.table,
                            manually_partitioned=True,
                        )

                        plan.run_action(
                            mavis.run_query,
                            mavis.qm.get_insert_query(activity_table, update_query),
                            _variation=f"insert_from_stg||{a.slug}",
                        )
                    else:
                        raise e

        else:
            if kind == kind.stream:
                update_query = _wrap_activity_stream(mavis, table, is_staging=True)
            else:
                update_query = mavis.qm.wrap_query(mavis.qm.stream_table(table, is_staging=True))

            plan.run_action(
                mavis.run_query,
                mavis.qm.get_insert_query(mavis.qm.stream_table(table), update_query),
                _variation="insert_from_stg",
            )

    # The end queries are super expensive so we want to show them

    if kind == kind.stream:
        if run_remove_customers_anon_full:
            plan.run_action(
                _run_remove_customers_v2,
                plan,
                run_remove_customers_anon_full,
                is_anon=True,
                on_staging=False,
                _variation="anon_full",
            )

        if run_identity_on_full:
            # Run Identity resolution on the staging data
            plan.run_action(
                _run_identity_resolution_v2,
                plan,
                ignore_slugs=run_remove_customers_anon_stg,
                on_staging=False,
                _variation="full",
            )

        # RERUN on anything that needs to be processed for ALL
        if run_aliasing_on_full:
            plan.run_action(
                _run_customer_aliasing_v2,
                plan,
                run_aliasing_on_full,
                on_staging=False,
                _variation="full",
            )

        if run_remove_customers_full:
            plan.run_action(
                _run_remove_customers_v2,
                plan,
                run_remove_customers_full,
                is_anon=False,
                on_staging=False,
                _variation="customer_full",
            )

        if not flags.should_show_flag("dataset-no-occurrence", plan.mavis.user):
            # runs on all the data
            plan.run_action(
                _compute_cache_columns_v2,
                plan,
                do_not_update_activities=do_not_update_activities,
                only_update_activities=only_update_activities,
                is_reconcile=is_reconcile or plan.recompute_full_cache,
            )

            # update the run
        plan.run_action(plan.update_plan_run, do_not_update_activities)

        # if the plan had a reconciled data that was older than a day
        company_table = mavis.company.table(table)
        if company_table and is_reconcile:
            plan.run_action(_update_activity_row, plan, company_table)

    else:
        plan.update_plan_run()
    is_resyning = plan.is_resyncing()

    if is_reconcile:
        plan.run_action(delete_duplicate_identities, plan)

    return is_resyning


@tracer.start_as_current_span("delete_duplicate_identities")
def delete_duplicate_identities(plan: Plan, skip_running=False):
    mavis = plan.mavis
    qm = plan.mavis.qm

    identity_table = mavis.qm.stream_table(plan.table, is_identity=True)
    diff_query = qm.Query()
    diff_query.add_column(qm.Column(table_column=ActivityColumns.activity_id))
    diff_query.add_column(qm.Column(table_column=ActivityColumns.ts))
    diff_query.add_column(qm.Column(table_column=ActivityColumns.customer))
    diff_query.add_column(
        qm.Column(
            function="lag",
            fields=dict(
                column=qm.Column(table_column=ActivityColumns.ts),
                group=[qm.Column(table_column=ActivityColumns.anonymous_customer_id)],
                order=qm.Column(table_column=ActivityColumns.ts),
            ),
            name_alias="last_ts",
        )
    )
    diff_query.add_column(
        qm.Column(
            function="lead",
            fields=dict(
                column=qm.Column(table_column=ActivityColumns.customer),
                group=[qm.Column(table_column=ActivityColumns.anonymous_customer_id)],
                order=qm.Column(table_column=ActivityColumns.ts),
            ),
            name_alias="next_customer",
        )
    )
    diff_query.set_from(identity_table)

    wrapped_query = qm.Query()
    wrapped_query.set_from(qm.Table(query=diff_query))
    wrapped_query.add_column(qm.Column(table_column=ActivityColumns.activity_id))
    wrapped_query.set_where(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="not_is_null",
                    left=qm.Column(table_column="last_ts"),
                ),
                "AND",
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_column=ActivityColumns.customer),
                    right=qm.Column(table_column="next_customer"),
                ),
                "AND",
                qm.Condition(
                    operator="less_than",
                    left=qm.Column(
                        function="date_diff",
                        fields=dict(
                            from_column=qm.Column(table_column="last_ts"),
                            to_column=qm.Column(table_column=ActivityColumns.ts),
                            datepart="minute",
                        ),
                    ),
                    right=qm.Column(value=30),
                ),
            ]
        )
    )
    delete_query = mavis.qm.get_delete_query(
        identity_table,
        mavis.qm.Condition(
            operator="is_in",
            left=mavis.qm.Column(table_column=ActivityColumns.activity_id),
            right=wrapped_query,
        ),
    )

    if skip_running:
        return delete_query

    try:
        mavis.run_query(delete_query)
    except QueryRunError:
        logger.info("Could not clean up the identity table")

    return None


@tracer.start_as_current_span("update_activity_counts")
def update_activity_counts(plan: Plan, company_table):
    mavis = plan.mavis
    total_activity_stream_row = 0

    stream_table = mavis.qm.stream_table(company_table.activity_stream)

    # Update all the activity with their row count
    query = mavis.qm.get_count_query(
        stream_table,
        [ActivityColumns.activity, ActivityColumns.activity_source],
        extra_functions=["min.ts", "max.ts"],
    ).to_query()
    result = mavis.run_query(query)
    data_rows = result.rows

    transform_slug_to_id = {t.slug: t for t in plan.processes}

    # deal with the missing activities
    for r in data_rows:
        if r[ActivityColumns.activity] is not None and transform_slug_to_id.get(r[ActivityColumns.activity_source]):
            transform = transform_slug_to_id.get(r[ActivityColumns.activity_source])
            current_activity = next(
                (a for a in plan.activities if a.slug == r[ActivityColumns.activity]),
                None,
            )

            if current_activity is None and r[ActivityColumns.activity] and transform:
                created_activity = _handle_creating_activity(
                    mavis, transform, company_table, r[ActivityColumns.activity]
                )

                plan.activities.append(
                    Activity(
                        id=created_activity.id,
                        slug=created_activity.slug,
                        name=created_activity.name,
                    )
                )

            # That activity already exists but is not related to the transformation
            elif current_activity and transform.transformation_id not in current_activity.transformation_ids:
                current_activity = next(a for a in plan.activities if a.slug == r[ActivityColumns.activity])
                # tie the activity to the transformation
                TransformationManager(mavis=mavis).add_activity(transform.transformation_id, current_activity.id)

    # Go through all the activities
    for activity in plan.activities:
        temp_rows = sum(r["total_rows"] for r in data_rows if r[ActivityColumns.activity] == activity.slug)

        min_ts = utils.min_values([r["min_ts"] for r in data_rows if r[ActivityColumns.activity] == activity.slug])
        max_ts = utils.max_values([r["max_ts"] for r in data_rows if r[ActivityColumns.activity] == activity.slug])

        # track all the activity rows
        fivetran_track(
            mavis.user,
            data=dict(
                activity_slug=activity.slug,
                total_rows=temp_rows,
                min_ts=min_ts,
                max_ts=max_ts,
            ),
        )

        # update the graph rows with the total row count
        graph_client.update_activity_rows(
            id=activity.id,
            row_count=min(
                MAX_INT,
                temp_rows,
            ),
        )

        total_activity_stream_row += temp_rows

    # update the table in graph with the data!!!!
    TableManager(mavis=mavis).update_rows(id=company_table.id, row_count=total_activity_stream_row)


@tracer.start_as_current_span("_handle_creating_activity")
def _handle_creating_activity(mavis: Mavis, transform, company_table, activity_slug):
    # Check if the transformation has already created other activities
    created_activity = ActivityManager(mavis=mavis).create(
        slug=activity_slug,
        name=utils.title(activity_slug),
        description=None,
        table_id=company_table.id,
        transformation_ids=transform.transformation_id,
    )
    return created_activity


def __get_to_time(transform):
    # if we can put data in the future then push it out a lot
    if transform.allow_future_data:
        return END_TIME
    else:
        return utils.utcnow()


@tracer.start_as_current_span("_add_sync_times")
def _add_sync_times(plan: Plan, transform, just_time=False):
    """
    Finds the best way to decimate the data
    """
    mavis = plan.mavis
    min_sync_time = utils.date_add(utils.utcnow(), "months", -1)

    process = plan.get(transform.id)
    get_current_span().set_attributes(
        {
            "to_sync_time": process.to_sync_time or "now",
            "from_sync_time": process.from_sync_time,
            "min_sync_time": min_sync_time,
            "max_days_to_insert": transform.max_days_to_insert or 0,
            "just_time": just_time,
        }
    )

    # if you already have the time ignore
    if process.to_sync_time:
        return None

    # handle the config from the transform
    if process.from_sync_time is None and transform.start_data_after:
        process.from_sync_time = transform.start_data_after

    # handle the company filter variable
    if process.from_sync_time is None and mavis.company.start_data_on:
        process.from_sync_time = mavis.company.start_data_on

    # if the data updated within the last 30 days then just insert it
    if process.from_sync_time and process.from_sync_time > min_sync_time:
        process.to_sync_time = __get_to_time(transform)
        return None

    # if there is a max days to insert then we will just add it
    if transform.max_days_to_insert:
        temp_from_sync_time = process.from_sync_time

        # CONFIRM that if there is a day window you are not constantly inserting the same zero rows
        temp_t = graph_client.get_transformation_updates(
            id=transform.id, started_at=utils.date_add(utils.utcnow(), "day", -5)
        ).transformation

        # make sure you deal with resyncs
        all_query_updates = [q for q in temp_t.query_updates]
        if len(temp_t.transformation_maintenances) > 0:
            all_query_updates = [
                q for q in all_query_updates if q.processed_at > temp_t.transformation_maintenances[-1].started_at
            ]

        # if we have an insert and the last insert was the same and didn't insert anything keep moving the pointer forward
        if len(all_query_updates) > 0:
            last_update = all_query_updates[-1]
            if last_update.from_sync_time[:10] >= process.from_sync_time[:10] and last_update.rows_inserted == 0:
                temp_from_sync_time = last_update.to_sync_time

        process.to_sync_time = utils.date_add(
            temp_from_sync_time,
            "days",
            transform.max_days_to_insert,
        )
        process.up_to_date = False
        return None

    if just_time:
        if not process.to_sync_time:
            # if we can put data in the future then push it out a lot
            process.to_sync_time = __get_to_time(transform)
        return None

    count_query = mavis.qm.Query()
    count_query.add_fields(**mavis.qm.get_default_fields(is_count=True))

    # use a temp query just in case we remove columns during the count
    temp_query = get_query(mavis, transform)
    temp_query.columns = []
    temp_query.add_column(mavis.qm.Column(all_columns=True))
    count_query.set_from(mavis.qm.Table(query=temp_query))
    count_query.add_column(
        mavis.qm.Column(
            function="date_trunc",
            fields=dict(
                datepart="day",
                column=mavis.qm.Column(
                    table_column=_get_ts_column(plan.kind, [c.name for c in transform.column_renames])
                ),
            ),
            name_alias="the_day",
        )
    )
    count_query.add_column(mavis.qm.Column(function="count_all", fields={}, name_alias="total_rows"))
    count_query.add_group_by(1)
    count_query.add_order_by(1)

    # get the data that is cached for a week
    data = mavis.run_query(count_query.to_query(), within_minutes=1000)

    # sort the data in case and remove NULL data
    data.rows = sorted([r for r in data.rows if r["the_day"]], key=lambda x: x["the_day"])
    # start counting the rows
    total_rows = 0

    # find the best time to decimate the data
    for row in data.rows:
        # if no day for some reason then ignore it
        if not row["the_day"]:
            continue

        if process.from_sync_time is None:
            process.from_sync_time = utils.date_add(row["the_day"], "day", -1)

        if row["the_day"] and row["the_day"] > process.from_sync_time:
            total_rows += row["total_rows"]

        if total_rows > mavis.config.max_inserts and row["the_day"] < utils.utcnow():
            process.to_sync_time = utils.date_add(row["the_day"], "day", 1)
            process.up_to_date = False
            break
    else:
        if total_rows > 0:
            process.to_sync_time = __get_to_time(transform)

    # just in case make sure it is not None
    if not process.to_sync_time:
        # if we can put data in the future then push it out a lot
        process.to_sync_time = __get_to_time(transform)

    # then you are probably out of data and you should make this a single run
    if process.from_sync_time is None or (process.from_sync_time < min_sync_time and not process.to_sync_time):
        # if no rows then do a count and try to figure out if it has not ben able to insert
        temp_t = graph_client.get_transformation_updates(
            id=transform.id, started_at=utils.date_add(utils.utcnow(), "day", -10)
        ).transformation
        if len(temp_t.query_updates) > 5 and sum(qu.rows_inserted for qu in temp_t.query_updates) == 0:
            raise SilenceError("No more rows to insert, consider changing this to a single run")


def __get_diff_with_default(from_sync_time, to_sync_time):
    if from_sync_time is None or from_sync_time < "1910":
        return 1
    elif to_sync_time is None:
        to_sync_time = utils.utcnow()
    return utils.date_diff(from_sync_time, to_sync_time, "minute")


def _check_rows_alert(mavis: Mavis, transform, process, total_rows=None, table=None):
    if transform.notify_row_count_percent_change:
        # check if we need to compute the total rows
        if total_rows is None and table is not None:
            # get the rows to do the insert
            data = mavis.run_query(mavis.qm.get_count_query(table).to_query())
            total_rows = data.rows[0]["total_rows"] or 0

        # no rows so ignore the update
        if total_rows == 0:
            return False

        # Only look at the average post the last resynced
        avg_rows_per_minute = utils.apply_function(
            "average",
            [
                q.rows_inserted / __get_diff_with_default(q.from_sync_time, q.to_sync_time)
                for q in transform.query_updates
                if transform.last_resynced_at is None or q.created_at > transform.last_resynced_at
            ],
        )

        # if there is no history then return nothing
        if not avg_rows_per_minute:
            return False

        # get the average rows per minutes
        current_rows_per_minute = total_rows / __get_diff_with_default(
            process.from_sync_time if process else None,
            process.to_sync_time if process else None,
        )

        percent_increase = abs(avg_rows_per_minute - current_rows_per_minute) / current_rows_per_minute

        if percent_increase > float(transform.notify_row_count_percent_change):
            template_model = dict(
                utm_medium="email",
                utm_content="row_alert",
                percent_diff=mavis.human_format(percent_increase, "percent"),
                alert_percent_diff=mavis.human_format(float(transform.notify_row_count_percent_change), "percent"),
                did_not_update=transform.do_not_update_on_percent_change,
                total_rows=mavis.human_format(total_rows, "number"),
                name=transform.name,
                transformation_id=transform.id,
            )

            send_email(
                mavis.company,
                [transform.production_queries[0].updated_by],
                25962158,
                template_model,
                tag="row_alert",
            )

            return transform.do_not_update_on_percent_change
    else:
        return False


def _update_dim_transform(mavis: Mavis, dim_id, transform):
    # set it as the customer attribute
    if transform.kind == transform.kind.customer_attribute:
        all_needed_cust = [t for t in mavis.company.tables if t.customer_dim_table_id is None]
        if len(all_needed_cust) == 1:
            t = all_needed_cust[0].dict()
            t["customer_dim_table_id"] = dim_id
            TableManager(mavis=mavis).update(
                id=t["id"],
                identifier=t["identifier"],
                default_time_between=t["default_time_between"],
                is_imported=t["is_imported"],
                customer_dim_table_id=dim_id,
                maintainer_id=t["maintainer_id"],
            )

    elif transform.kind == transform.kind.spend:
        if len(mavis.company.tables) == 1:
            TableManager(mavis=mavis).add_aggregation_dim(id=mavis.company.tables[0].id, dim_table_id=dim_id)


@tracer.start_as_current_span("_run_regular_insert")
def _run_regular_insert(plan: Plan, transform, skip_running=False):
    process = plan.get(transform.id)
    mavis = plan.mavis
    get_current_span().set_attributes(
        {
            "from_sync_time": process.from_sync_time,
            "to_sync_time": process.to_sync_time,
        }
    )

    is_stream = transform.kind == transform.kind.stream
    include_cache_columns = (
        is_stream and process.from_sync_time is None and transform.has_source and not plan.is_shared_activity
    )
    # get the query
    query = get_transform_sql_query(
        plan,
        transform,
        process.from_sync_time,
        process.to_sync_time,
        include_cache_columns,
    )

    # HACK: to deal with redshift being stupid
    if not process.drop_and_create:
        table = mavis.qm.stream_table(transform.table, is_staging=True)
        insert_query = mavis.qm.get_insert_query(table, query)
        if skip_running:
            return insert_query

        # insert the data
        mavis.run_query(insert_query)

    else:
        table = mavis.qm.stream_table(transform.table)
        stg_table = mavis.qm.stream_table(transform.table, is_staging=True)

        if skip_running:
            return None

        # define the extra pieces for the column
        extra = dict(redshift="ENCODE zstd")

        columns = [
            dict(
                name=c.get_name(),
                type=c.get_type(),
                extra=(
                    extra.get(mavis.company.warehouse_language)
                    if c.get_name() not in (ActivityColumns.customer, "enriched_ts")
                    else None
                ),
            )
            for c in query.get_all_columns()
        ]
        mavis.run_query(
            [
                mavis.qm.get_drop_table_query(table),
                mavis.qm.get_drop_table_query(stg_table),
                mavis.qm.get_create_table_query(
                    table,
                    add_ons=__get_transform_add_ons(
                        transform.kind,
                        table=transform.table,
                        columns=[c.name for c in transform.column_renames],
                    ),
                    column_dicts=columns,
                ),
                mavis.qm.get_create_table_query(
                    stg_table,
                    column_dicts=columns,
                ),
                mavis.qm.get_insert_query(table, query),
            ]
        )

        tb = TableSchema(
            schema_name=table.schema,
            table_name=table.table,
            columns=[c.dict() for c in transform.column_renames],
        )
        st_tb = TableSchema(
            schema_name=stg_table.schema,
            table_name=stg_table.table,
            columns=columns,
        )

        # Add the table to the warehouse
        table_id = WarehouseManager(mavis=mavis).create(tb)
        WarehouseManager(mavis=mavis).create(st_tb)
        # convert the table into a dim
        dim_id = WarehouseManager(mavis=mavis).convert_to_dim(
            table_id, _get_transformation_join_key(transform.column_renames)
        )

        # deal with the transform to setup the dim
        _update_dim_transform(mavis, dim_id, transform)

        process.drop_and_create = True
        data = mavis.run_query(mavis.qm.get_count_query(table).to_query())

        process.rows_inserted = data.rows[0]["total_rows"] or 0
        process.bytes_scanned = data.context.data_scanned


@tracer.start_as_current_span("run_mutable_insert")
def run_mutable_insert(plan: Plan, transform, skip_running=False):
    process = plan.get(transform.id)
    mavis = plan.mavis
    qm = mavis.qm

    # for mutable updates make sure you go back from the current time
    process.from_sync_time = min(utils.utcnow(), process.from_sync_time)

    # exit if no activities
    if not plan.get_all_activities(transform.id):
        logger.info("No activities for transformation", transformation_id=transform.id)
        return None

    # get the query
    query = get_query(mavis, transform, include_metadata=True, include_casting=True)

    query.add_fields(
        from_sync_time=process.from_sync_time,
        to_sync_time=process.to_sync_time,
    )

    # find the activity
    subquery = qm.Query()
    subquery.add_column(
        qm.Column(
            table_column=plan.get_id_column(),
            table_alias="d",
            casting=__get_casting(transform, plan.get_id_column()),
        )
    )
    subquery.set_from(mavis.qm.stream_table(transform.table, alias="d"))

    # filter the sub query with data from the activity (for speed)
    if transform.kind == transform.kind.stream:
        subquery.add_filter(
            qm.Condition(
                operator="is_in",
                left=qm.Column(
                    table_column=ActivityColumns.activity,
                    table_alias="d",
                    casting=__get_casting(transform, plan.get_id_column()),
                ),
                right=[qm.Column(value=slug) for slug in plan.get_all_activities(transform.id)],
            )
        )

    # add the tranfromation source filters
    subquery.add_filter(
        qm.Condition(
            operator="equal",
            left=qm.Column(
                table_column=plan.get_source_column(),
                column_type="string",
                table_alias="d",
            ),
            right=qm.Column(value=transform.slug),
        )
    )

    # process all the fitlrs
    if process.apply_mutable_time:
        subquery.add_filter(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(
                    table_column=plan.get_ts_column(),
                    table_alias="d",
                    column_type="timestamp",
                ),
                right=qm.Column(
                    value=process.from_sync_time,
                    casting="timestamp",
                ),
            )
        )

        subquery.add_filter(
            qm.Condition(
                operator="less_than_equal",
                left=qm.Column(
                    table_alias="d",
                    table_column=plan.get_ts_column(),
                    column_type="timestamp",
                ),
                right=qm.Column(
                    value=process.to_sync_time or utils.utcnow(),
                    casting="timestamp",
                ),
            )
        )

    full_filter = qm.Filter()

    if process.apply_mutable_time:
        full_filter.add_filter(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(
                    table_column=plan.get_ts_column(),
                    table_alias="s",
                    column_type="timestamp",
                ),
                right=qm.Column(
                    value=process.from_sync_time,
                    casting="timestamp",
                ),
            ),
            "AND",
        )
        full_filter.add_filter(
            qm.Condition(
                operator="less_than_equal",
                left=qm.Column(
                    table_alias="s",
                    table_column=plan.get_ts_column(),
                    column_type="timestamp",
                ),
                right=qm.Column(
                    value=process.to_sync_time or utils.utcnow(),
                    casting="timestamp",
                ),
            ),
            "AND",
        )
    full_filter.add_filter(
        qm.Condition(
            operator="not_is_in",
            left=qm.Column(
                table_alias="s",
                table_column=plan.get_id_column(),
                casting=__get_casting(transform, plan.get_id_column()),
            ),
            right=subquery,
        ),
        "AND",
    )

    # set the where condition for the whole join
    query.set_where(full_filter)

    # process the mutable updates
    table = mavis.qm.stream_table(transform.table, is_staging=True)

    # deal with the data
    if plan.manually_partitioned:
        subquery.set_from(mavis.qm.get_activity_table(transform.table, process.activity_slugs, alias="d"))

    insert_query = mavis.qm.get_insert_query(table, query)
    if skip_running:
        return insert_query
    # insert the data
    mavis.run_query(insert_query)

    return query


@tracer.start_as_current_span("_update_materialized_view")
def _update_materialized_view(plan: Plan, transform):
    get_current_span().set_attribute("transform_slug", transform.slug)

    mavis = plan.mavis
    table = mavis.qm.stream_table(transform.table)
    query = get_query(mavis, transform, include_metadata=True, include_casting=True)

    # Running a count query on the raw data so if it fails then it will process the data
    data = mavis.run_query(mavis.qm.get_count_query(query).to_query())
    if data.total_rows == 0:
        data = mavis.run_query(mavis.qm.get_count_query(query).to_query())

    if data.total_rows == 0:
        raise ValueError("Erroring out our materialization")

    # check and deal with the alert
    if _check_rows_alert(mavis, transform, None, table=query, total_rows=data.rows[0]["total_rows"]):
        return None
    process = plan.get(transform.id)

    # process the data
    if plan._should_resync(process) or process.drop_and_create:
        if plan._should_resync(process):
            handle_error_with_maintenance(
                plan,
                maintenance_kinds_enum.resynced,
                activity_obj=None,
                process=process,
            )

        mavis.run_query(
            [
                mavis.qm.get_drop_materialize_view_query(table),
                mavis.qm.get_create_materialize_view_query(table, query),
            ]
        )

        tb = TableSchema(
            schema_name=table.schema,
            table_name=table.table,
            columns=[c.dict() for c in transform.column_renames],
        )
        # Add the table to the warehouse
        table_id = WarehouseManager(mavis=mavis).create(tb, async_index=False)
        # convert the table into a dim
        dim_id = WarehouseManager(mavis=mavis).convert_to_dim(
            table_id, _get_transformation_join_key(transform.column_renames)
        )

        # deal with the transform to setup the dim
        _update_dim_transform(mavis, dim_id, transform)

    else:
        if plan.manually_partitioned:
            for a_slug in process.activity_slugs:
                table = mavis.qm.stream_table(transform.table, activity=a_slug)
                n_query = mavis.qm.wrap_query(query)
                n_query.add_filter(
                    mavis.qm.Condition(
                        operator="equal",
                        left=mavis.qm.Column(table_column=ActivityColumns.activity),
                        right=mavis.qm.Column(value=a_slug),
                    )
                )
                mavis.run_query(mavis.qm.get_update_materialize_view_query(table, n_query))

        else:
            mavis.run_query(mavis.qm.get_update_materialize_view_query(table, query))

    # count how many rows were inserted
    p = plan.get(transform.id)
    p.rows_inserted = data.rows[0]["total_rows"] or 0
    p.to_sync_time = utils.utcnow()
    p.up_to_date = True


@tracer.start_as_current_span("_update_view")
def _update_view(plan: Plan, transform):
    get_current_span().set_attribute("transform_slug", transform.slug)

    mavis = plan.mavis
    table = mavis.qm.stream_table(transform.table)
    query = get_query(mavis, transform, include_metadata=True, include_casting=True)
    process = plan.get(transform.id)
    # process the data
    if process.drop_and_create:
        handle_error_with_maintenance(
            plan,
            maintenance_kinds_enum.resynced,
            activity_obj=None,
            process=process,
        )
        mavis.run_query(
            [
                mavis.qm.get_drop_view_query(table),
                mavis.qm.get_create_view_query(table, query, project_id=mavis.company.project_id),
            ]
        )
        tb = TableSchema(
            schema_name=table.schema,
            table_name=table.table,
            columns=[c.dict() for c in transform.column_renames],
        )

        # Add the table to the warehouse
        table_id = WarehouseManager(mavis=mavis).create(tb, async_index=False)
        # convert the table into a dim
        dim_id = WarehouseManager(mavis=mavis).convert_to_dim(
            table_id, _get_transformation_join_key(transform.column_renames)
        )

        # deal with the transform to setup the dim
        _update_dim_transform(mavis, dim_id, transform)

        # count how many rows were inserted
        data = mavis.run_query(mavis.qm.get_count_query(table).to_query())
        p = plan.get(transform.id)
        p.rows_inserted = data.rows[0]["total_rows"] or 0
        p.to_sync_time = utils.utcnow()
        p.up_to_date = True
        return True


@tracer.start_as_current_span("_delete_window")
def _delete_window(
    mavis: Mavis,
    table,
    kind,
    from_resync_time,
    to_resync_time,
    all_transformations=None,
    use_run_at=False,
    activity=None,
):
    if use_run_at:
        col_name = ActivityColumns.run_at
    else:
        tem_table = WarehouseManager(mavis=mavis).get_schema().table(mavis.company.warehouse_schema, table)
        if tem_table:
            columns = [c.name for c in tem_table.columns]
        else:
            columns = []
        col_name = _get_ts_column(kind, columns)

    # got the table
    table = mavis.qm.stream_table(table, activity=activity)
    cond = mavis.qm.Filter(
        filters=[
            mavis.qm.Condition(
                operator="greater_than_equal",
                left=mavis.qm.Column(table_column=col_name),
                right=mavis.qm.Column(value=from_resync_time, casting="timestamp"),
            ),
            "AND",
            mavis.qm.Condition(
                operator="less_than_equal",
                left=mavis.qm.Column(table_column=col_name),
                right=mavis.qm.Column(value=to_resync_time, casting="timestamp"),
            ),
        ]
    )

    # add the specific transformations
    if all_transformations:
        cond.add_filter(
            mavis.qm.Condition(
                operator="is_in",
                left=mavis.qm.Column(table_column=ActivityColumns.activity_source),
                right=[mavis.qm.Column(value=v) for v in all_transformations],
            ),
            "AND",
        )
    # return the query
    return mavis.qm.get_delete_query(table, cond)


@tracer.start_as_current_span("undo_identity_resolution")
def undo_identity_resolution(plan: Plan, process, from_time, skip_running=False, ignore_query=None):
    mavis = plan.mavis
    qm = mavis.qm
    filt = qm.Filter(
        filters=[
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=ActivityColumns.activity_source),
                right=qm.Column(value=process.slug),
            )
        ]
    )
    # added the days
    if from_time:
        filt.add_filter(
            mavis.qm.Condition(
                operator="greater_than",
                left=mavis.qm.Column(table_column=ActivityColumns.ts),
                right=mavis.qm.Column(value=from_time, casting="timestamp"),
            ),
            "AND",
        )

    if ignore_query:
        filt.add_filter(
            qm.Condition(
                operator="not_is_in",
                left=qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                right=create_single_row_table(
                    mavis,
                    qm.Table(query=ignore_query),
                    qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                    make_distinct=False,
                    add_filter=True,
                ),
            )
        )

    # all the anonymous_customer_ids that I will be replacing
    update_query = create_single_row_table(
        mavis,
        mavis.qm.stream_table(plan.table, is_identity=True),
        qm.Column(table_column=ActivityColumns.anonymous_customer_id),
        add_filter=True,
    )
    update_query.add_filter(filt)
    if not skip_running:
        count_data = None
        try:
            query = mavis.qm.get_count_query(update_query).to_query()
            count_data = mavis.run_query(query)
        except QueryRunError as e:
            logger.debug("Error with count", error=e, query=query)
            table = mavis.qm.stream_table(plan.table, is_identity=True).table
            table_missing = _check_table_missing(mavis, table, e)
            if table_missing:
                return None

        # log the work
        logger.info(
            "Total rows that will be updated",
            transform=process.name,
            total_rows=count_data.rows[0]["total_rows"] if count_data is not None else None,
        )

        # if no change don't bother runniing
        if count_data is not None and count_data.rows[0]["total_rows"] == 0:
            return None

    # don't bother running if not needed
    should_run = _should_full_identity_run(mavis, plan.table, add_filt=filt, skip_running=skip_running)
    if not should_run:
        return None

    # all the activity_ids I will keep
    keep_id_query = create_single_row_table(
        mavis,
        mavis.qm.stream_table(plan.table, is_identity=True),
        qm.Column(table_column=ActivityColumns.activity_id),
        add_filter=True,
    )
    keep_id_query.add_filter(
        qm.Condition(
            operator="not_equal",
            left=qm.Column(table_column=ActivityColumns.activity_source),
            right=qm.Column(value=process.slug),
        )
    )

    # added the days
    if from_time:
        # days are positive so do the negative of it
        keep_id_query.add_filter(
            qm.Condition(
                operator="less_than_equal",
                left=qm.Column(table_column=ActivityColumns.ts),
                right=qm.Column(value=from_time, casting="timestamp"),
            ),
            "AND",
        )

    filt = qm.Filter(
        filters=[
            qm.Condition(
                operator="is_in",
                left=mavis.qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                right=update_query,
            ),
            "AND",
            qm.Condition(
                operator="not_is_in",
                left=mavis.qm.Column(table_column=ActivityColumns.activity_id),
                right=keep_id_query,
            ),
        ]
    )

    if not plan.manually_partitioned:
        filt.add_filter(
            qm.Condition(
                operator="equal",
                left=mavis.qm.Column(table_column=ActivityColumns.activity),
                # this doesn't matter since I reset it below
                right=mavis.qm.Column(value="t"),
            )
        )

    ignore_transformations = [t.slug for t in plan.processes if t.update_type == "materialized_view"]

    # Update all the tables or just one of them
    for ac in plan.activities:
        if (
            ac.has_source
            and (len(ac.transformation_slugs) > 1 or ac.transformation_slugs[0] != process.slug)
            # make sure something exists that is not ignored
            and any(t_slug not in ignore_transformations for t_slug in ac.transformation_slugs)
            # ignore anything that is resynced
            and any(not plan.should_resync(t_id) for t_id in ac.transformation_ids)
        ):
            # undo each table
            if plan.manually_partitioned:
                desired_table = mavis.qm.stream_table(plan.table, activity=ac.slug)
            else:
                desired_table = mavis.qm.stream_table(plan.table)
                filt.filters[-1].right.value = ac.slug

            # get the update query
            update_query = mavis.qm.get_update_query(
                desired_table,
                [
                    qm.Condition(
                        operator="equal",
                        left=qm.Column(table_column=ActivityColumns.activity_occurrence),
                        right=qm.Column(value=None),
                    ),
                    qm.Condition(
                        operator="equal",
                        left=qm.Column(table_column=ActivityColumns.customer),
                        right=qm.Column(value=None),
                    ),
                ],
                filt,
                update_wlm_count=mavis.config.update_wlm_count,
            )

            # for testing
            if skip_running:
                return update_query

            try:
                mavis.run_query(update_query)
            except QueryRunError as e:
                table_missing = _check_table_missing(mavis, desired_table.table, e)
                if table_missing:
                    continue
                else:
                    raise e

    plan.recompute_full_cache = True


@tracer.start_as_current_span("_get_the_removed_customers")
def _get_the_removed_customers(plan: Plan, process, use_annon=False, from_time=None, ignore_query=None):
    mavis = plan.mavis
    qm = mavis.qm
    col = ActivityColumns.anonymous_customer_id if use_annon else ActivityColumns.customer
    # Define the table that will be used to reinsert all the data
    if plan.manually_partitioned:
        sub_query = None
        for a in process.activity_slugs:
            union_query = qm.Query()
            union_query.add_column(qm.Column(table_column=col))
            union_query.add_column(qm.Column(table_column=ActivityColumns.activity_source))
            union_query.set_from(mavis.qm.stream_table(plan.table, activity=a))

            if sub_query:
                union_query.set_union(sub_query)
                sub_query = union_query

            else:
                sub_query = union_query

        table = qm.Table(query=qm.wrap_query(sub_query, alias="a"))

    else:
        table = mavis.qm.stream_table(plan.table)

    temp_query = create_single_row_table(mavis, table, qm.Column(table_column=col), add_filter=True)
    temp_query.add_filter(
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=ActivityColumns.activity_source),
            right=qm.Column(value=process.slug),
        )
    )

    # add the filter for time
    if from_time:
        temp_query.add_filter(
            mavis.qm.Condition(
                operator="greater_than",
                left=mavis.qm.Column(table_column=plan.get_ts_column()),
                right=mavis.qm.Column(value=from_time, casting="timestamp"),
            ),
            "AND",
        )

    if ignore_query:
        temp_query.add_filter(
            qm.Condition(
                operator="not_is_in",
                left=qm.Column(table_column=col),
                right=create_single_row_table(
                    mavis,
                    qm.Table(query=ignore_query),
                    qm.Column(table_column=col),
                    make_distinct=False,
                    add_filter=True,
                ),
            )
        )

    return temp_query


@tracer.start_as_current_span("_adding_removed_customers")
def _add_removed_customers(
    mavis,
    transform,
    from_sync_time,
    removed_customer_query,
    use_annon=False,
    skip_running=False,
):
    qm = mavis.qm

    # get the query (wrap it to deal with anonymous_cusotmer_id)
    query = qm.wrap_query(
        get_query(mavis, transform, include_metadata=True, include_casting=True),
        alias="s",
    )

    # get the data
    col = ActivityColumns.anonymous_customer_id if use_annon else ActivityColumns.customer

    # get all the old data
    query.add_filter(
        mavis.qm.Condition(
            operator="less_than",
            left=mavis.qm.Column(table_alias="s", table_column=ActivityColumns.ts),
            right=mavis.qm.Column(value=from_sync_time, casting="timestamp"),
        )
    )

    query.add_filter(
        mavis.qm.Condition(
            operator="is_in",
            left=qm.Column(table_column=col, table_alias="s"),
            right=removed_customer_query,
        )
    )

    table = mavis.qm.stream_table(transform.table, is_staging=True)
    insert_query = mavis.qm.get_insert_query(table, query)

    if skip_running:
        return insert_query

    mavis.run_query(insert_query)


def get_transform_sql_query(plan: Plan, transform, from_sync_time, to_sync_time, include_cache_columns):
    # get the query
    query = get_query(
        plan.mavis,
        transform,
        include_metadata=True,
        include_casting=True,
        include_stream_cache_columns=include_cache_columns,
    )
    qm = plan.mavis.qm

    # add the fields
    query.add_fields(
        from_sync_time=from_sync_time or START_TIME,
        to_sync_time=to_sync_time,
    )

    if from_sync_time:
        query.add_filter(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(table_alias="s", table_column=plan.get_ts_column()),
                right=qm.Column(value=from_sync_time, casting="timestamp"),
            )
        )

    # add a sync date in the table
    query.add_filter(
        qm.Condition(
            operator="less_than_equal",
            left=qm.Column(table_alias="s", table_column=plan.get_ts_column()),
            right=qm.Column(value=to_sync_time, casting="timestamp"),
        )
    )
    return query


@tracer.start_as_current_span("_delete_transformation")
def _delete_transformation(plan: Plan, transform, days=None):
    mavis = plan.mavis
    # if it is a remove customer than reinsert all the data form all the transformations
    process = plan.get(transform.id)

    if days:
        # days are positive so do the negative of it
        from_time = utils.date_add(utils.utcnow(), "days", -1 * abs(days))
    else:
        from_time = None

    # get the data of everyone who will be added back
    people_added = get_transform_sql_query(plan, transform, from_time, utils.utcnow(), False)

    if process.remove_customers:
        options = [False]
        if process.has_source:
            options.append(True)

        # Insert all the rows for the once with anonymous_customer_id too
        for use_annon in options:
            # get the query of all the customers who will be removed and not added back
            remove_query = _get_the_removed_customers(
                plan,
                process,
                use_annon=use_annon,
                from_time=from_time,
                ignore_query=people_added,
            )

            # get the count data
            query = mavis.qm.get_count_query(remove_query).to_query()
            count_data = mavis.run_query(query)

            # log the work
            logger.info(
                "Total rows that will be updated",
                transform=transform.slug,
                total_rows=count_data.rows[0]["total_rows"],
            )

            # don't bother running the data will be removed
            if count_data.rows[0]["total_rows"] == 0:
                continue

            for temp_process in plan.processes:
                # don't bother with most processing
                if (
                    temp_process.transformation_id == transform.id
                    or temp_process.remove_customers
                    or temp_process.update_type == "materialized_view"
                    or (use_annon and not temp_process.has_source)
                    or plan._should_resync(temp_process)
                ):
                    continue

                add_transform = graph_client.get_transformation_for_processing(
                    id=temp_process.transformation_id
                ).transformation

                # add the has source
                _add_removed_customers(
                    mavis,
                    add_transform,
                    temp_process.from_sync_time,
                    remove_query,
                    use_annon,
                )

    elif process.has_source:
        # undo all the identity resolution
        undo_identity_resolution(plan, process, from_time, ignore_query=people_added)

    # do not to delete if you need to drop and create
    if plan.get(transform.id).drop_and_create:
        return None

    # create the data
    table = mavis.qm.stream_table(transform.table)
    cond = mavis.qm.Filter(
        filters=[
            mavis.qm.Condition(
                operator="equal",
                left=mavis.qm.Column(table_column=plan.get_source_column()),
                right=mavis.qm.Column(value=transform.slug),
            )
        ]
    )
    from_time = None

    # add a filter based on the days
    if days:
        # days are positive so do the negative of it
        from_time = utils.date_add(utils.utcnow(), "days", -1 * abs(days))
        cond.add_filter(
            mavis.qm.Condition(
                operator="greater_than",
                left=mavis.qm.Column(table_column=plan.get_ts_column()),
                right=mavis.qm.Column(value=from_time, casting="timestamp"),
            ),
            "AND",
        )

        # don't try and delete it if has been too long
        if process.from_sync_time is None or process.from_sync_time < from_time:
            return None

    # if the plan is a shared activity then resync
    if not days and plan.requires_delete_shared_activity(transform.id):
        _update_occurence_before_delete(plan, cond, transform)

    # delete the table
    if days or not (hasattr(transform, "do_not_delete_on_resync") and transform.do_not_delete_on_resync):
        if plan.manually_partitioned:
            for a_slug in process.activity_slugs:
                table = mavis.qm.stream_table(transform.table, activity=a_slug)
                mavis.run_query(mavis.qm.get_delete_query(table, cond))
        elif transform.kind == transform.kind.stream or days:
            mavis.run_query(mavis.qm.get_delete_query(table, cond))
        else:
            try:
                mavis.run_query(mavis.qm.get_delete_query(table, cond))
            except QueryRunError:
                plan.get(transform.id).drop_and_create = True

        # apply the processing on stream only
        if transform.kind == transform.kind.stream:
            _clean_stg_tables(
                mavis,
                transform.table,
                transform.kind,
                is_identity=True,
                add_condition=cond,
            )

        # don't dirty activities if it is just delete recent days
        if plan._should_resync(process):
            plan.dirty_all_activities(transform.id)

    # update the data based on the query so from_sync_time and everything is correct for the that will run
    plan.update_from_sync_time(transform.id, from_time)


@tracer.start_as_current_span("_update_occurence_before_delete")
def _update_occurence_before_delete(plan: Plan, cond, transform):
    mavis = plan.mavis
    all_customers = mavis.qm.Query()
    all_customers.add_column(__get_person_column(mavis))
    all_customers.set_where(cond)
    all_customers.make_distinct()

    if flags.should_show_flag("dataset-no-occurrence", plan.mavis.user):
        return None

    all_qs = []

    if plan.manually_partitioned:
        # handle the partitioned table
        all_customers.set_from(
            mavis.qm.get_activity_table(transform.table, slugs=plan.get(transform.id).activity_slugs)
        )

        for a in plan.get_all_activities(transform.id):
            # create the uqnieq query
            all_qs.append(
                mavis.qm.get_update_query(
                    mavis.qm.stream_table(table=transform.table, alias="u", activity=a),
                    [
                        mavis.qm.Condition(
                            operator="equal",
                            left=mavis.qm.Column(
                                table_column=ActivityColumns.activity_occurrence,
                                table_alias="u",
                            ),
                            right=mavis.qm.Column(value=None),
                        ),
                    ],
                    mavis.qm.Condition(
                        operator="is_in",
                        left=__get_person_column(mavis, alias="u"),
                        right=all_customers,
                    ),
                    update_wlm_count=mavis.config.update_wlm_count,
                )
            )
    else:
        all_customers.set_from(mavis.qm.stream_table(transform.table))

        # create the uqnieq query
        all_qs.append(
            mavis.qm.get_update_query(
                mavis.qm.stream_table(table=transform.table, alias="u"),
                [
                    mavis.qm.Condition(
                        operator="equal",
                        left=mavis.qm.Column(
                            table_column=ActivityColumns.activity_occurrence,
                            table_alias="u",
                        ),
                        right=mavis.qm.Column(value=None),
                    ),
                ],
                mavis.qm.Filter(
                    filters=[
                        mavis.qm.Condition(
                            operator="is_in",
                            left=mavis.qm.Column(table_column=ActivityColumns.activity, table_alias="u"),
                            right=[mavis.qm.Column(value=v) for v in plan.get_all_activities(transform.id)],
                        ),
                        "AND",
                        mavis.qm.Condition(
                            operator="is_in",
                            left=__get_person_column(mavis, alias="u"),
                            right=all_customers,
                        ),
                    ]
                ),
                update_wlm_count=mavis.config.update_wlm_count,
            )
        )

    # update the activity stream
    mavis.batch_run_query(all_qs)


@tracer.start_as_current_span("_update_process_insert")
def _update_process_insert(plan: Plan):
    mavis = plan.mavis
    kind = plan.kind
    table_name = plan.table

    # handle creating new tables
    if kind in (kind.enrichment, kind.spend) and all(
        p.drop_and_create or p.update_type == "view" for p in plan.processes
    ):
        is_staging = False
    else:
        is_staging = True

    stg_table = mavis.qm.stream_table(table_name, is_staging=is_staging)
    source_col = plan.get_source_column()
    ts_col = plan.get_ts_column()

    extra_functions = []
    if ts_col:
        extra_functions.append(f"max.{ts_col}")

    # columns
    group_cols = [source_col]
    if kind == kind.stream:
        group_cols.append("activity")

    data = mavis.run_query(mavis.qm.get_count_query(stg_table, group_cols, extra_functions=extra_functions).to_query())

    # update all the rows with what was inserted
    for p in plan.processes:
        rws = [r for r in data.rows if r[source_col] == p.slug]

        if rws:
            p.to_sync_time = max([r.get(f"max_{ts_col}" or utils.utcnow()) for r in rws])
            p.rows_inserted = sum([r["total_rows"] for r in rws])

        plan.update_transform_run(p.transformation_id, p.duration)

    # update the activity rows:
    if kind == kind.stream:
        # update all the rows with what was inserted
        for a in plan.activities:
            a.row_count = sum([r["total_rows"] for r in data.rows if r["activity"] == a.slug])

        activity_slugs = [a.slug for a in plan.activities]

        for r in data.rows:
            if r["activity"] not in activity_slugs:
                logger.info("new activity found ", activity=r["activity"], source=r[source_col])
                # CREATE THE ACTIVITY
                transformation_id = next(
                    (p.transformation_id for p in plan.processes if p.slug == r[source_col]),
                    None,
                )

                if not transformation_id:
                    logger.info("No transformation found for activity")
                    continue

                # get the transformation
                transform = graph_client.get_transformation_context(id=transformation_id).transformation

                try:
                    (activity_objs, _) = _create_activities(mavis, transform, [r["activity"]], do_not_remove=True)

                    activity_slugs.append(r["activity"])

                    for activity_obj in activity_objs:
                        if activity_obj.id not in (a.id for a in plan.activities):
                            # Add the activity
                            plan.activities.append(
                                Activity(
                                    id=activity_obj.id,
                                    slug=activity_obj.slug,
                                    name=activity_obj.name,
                                    row_count=r["total_rows"],
                                    has_source=transform.has_source,
                                    transformation_ids=[transform.id],
                                    transformation_slugs=[transform.slug],
                                )
                            )
                except QueryRunError:
                    logger.exception("Failed to create activity")

    return not is_staging


@tracer.start_as_current_span("_update_activity_row")
def _update_activity_row(plan: Plan, company_table):
    mavis = plan.mavis
    total_rows = 0

    if plan.manually_partitioned:
        for a in plan.activities:
            table = mavis.qm.stream_table(company_table, activity=a.slug)
            data = mavis.run_query(mavis.qm.get_count_query(table).to_query())
            row_count = data.rows[0]["total_rows"] or 0
            graph_client.update_activity_rows(
                id=a.id,
                row_count=min(MAX_INT, row_count),
            )
            total_rows += row_count
    else:
        am = {a.slug: a for a in plan.activities}
        table = mavis.qm.stream_table(company_table.activity_stream)
        data = mavis.run_query(mavis.qm.get_count_query(table, ["activity"]).to_query())
        for r in data.rows:
            row_count = r["total_rows"]
            if am.get(r["activity"]):
                graph_client.update_activity_rows(
                    id=am[r["activity"]].id,
                    row_count=min(MAX_INT, row_count),
                )

                total_rows += row_count

    # update graph
    TableManager(mavis=mavis).update_rows(id=company_table.id, row_count=total_rows)


def _get_transformation_join_key(columns):
    names = [c.name for c in columns]
    return utils.find_first_val(
        names,
        ["enriched_activity_id", "id", "activity_id", ActivityColumns.customer, "%_id"],
    )


def _get_ts_column(kind, columns):
    if kind in (kind.enrichment, kind.spend):
        return utils.find_first_val(columns, ENRICHED_TS_COLS)
    elif kind == kind.stream:
        return "ts"


def __get_transform_add_ons(kind, table, columns=None):
    if kind in (kind.enrichment, kind.spend):
        id_col = utils.find_first_val(columns or [], ENRICHED_ID_COLS) or ENRICHED_ID_COLS[0]
        ts_col = _get_ts_column(kind, columns)

        add_ons = dict(
            sortmode="AUTO",
            diststyle="EVEN",
            clusterkey=f"({id_col})",
            index=f"({id_col})",
            index_name=f"{table}_enriched_index",
        )
        # add the ts columns
        if ts_col:
            add_ons.update(
                sortmode="AUTO",
                diststyle="EVEN",
                order_key=ts_col,
                partition_column=f"TIMESTAMP_TRUNC({ts_col}, MONTH)",
            )

        return add_ons

    elif kind == kind.customer_attribute:
        return dict(
            sortkey=ActivityColumns.customer,
            distkey=ActivityColumns.customer,
            index_key=ActivityColumns.customer,
            index="(customer)",
            clusterkey="(customer)",
            index_name=f"{table}_customer_index",
        )
    else:
        return {}


def external_get_stream_addons(user, table, is_identity=False, manually_partitioned=False):
    return __get_activity_stream_add_ons(user, table, is_identity, manually_partitioned)


def __get_activity_stream_add_ons(user, table, is_identity=False, manually_partitioned=False):
    if is_identity:
        return dict(
            # redshift
            distkey=f'"{ActivityColumns.anonymous_customer_id}"',
            sortkey=f'"{ActivityColumns.ts}"',
            # sortmode="AUTO",
            # diststyle="AUTO",
            # diststyle="EVEN",
            # MSSQL
            order_key="ts",
            index_key=ActivityColumns.anonymous_customer_id,
            # athena
            partitioned_by=f"{ActivityColumns.anonymous_customer_id}, DATE({ActivityColumns.ts}) DATE",
            # bigquery
            clusterkey=ActivityColumns.anonymous_customer_id,
            partition_column=f"TIMESTAMP_TRUNC({ActivityColumns.ts}, MONTH)",
            # data bricks
            partition_by=ActivityColumns.anonymous_customer_id,
            # snowflake
            cluster_column=f"({ActivityColumns.anonymous_customer_id}, to_date({ActivityColumns.ts}))",
            # posgres-specific indexes
            index_name=table,
            anonymous_customer_index="anc",
        )
    elif manually_partitioned:
        if flags.should_show_flag("dataset-no-occurrence", user):
            return dict(
                # distkey='ActivityColumns.customer',
                # redshift
                diststyle="EVEN",
                sortkey=f'"{ActivityColumns.ts}"',
                # sortmode="AUTO",
                # diststyle="AUTO",
                # MSSQL
                order_key="ts",
                index_key=ActivityColumns.customer,
                # athena
                partitioned_by=f"DATE({ActivityColumns.ts}) DATE",
                # databricks
                partition_by=ActivityColumns.activity_occurrence,
                # bigquery
                clusterkey=f"{ActivityColumns.customer}",
                partition_column=f"TIMESTAMP_TRUNC({ActivityColumns.ts}, MONTH)",
                # snowflake
                cluster_column=f"(to_date({ActivityColumns.ts}))",
                # posgres-specific indexes
                index_name_part=table,
                customer_idx="c",
            )
        else:
            return dict(
                # distkey='ActivityColumns.customer',
                # redshift
                diststyle="EVEN",
                sortkey=f'"{ActivityColumns.activity_occurrence}", "{ActivityColumns.ts}"',
                # sortmode="AUTO",
                # diststyle="AUTO",
                # MSSQL
                order_key="ts",
                index_key=ActivityColumns.customer,
                # athena
                partitioned_by=f"{ActivityColumns.activity_occurrence} INT, DATE({ActivityColumns.ts}) DATE",
                # databricks
                partition_by=ActivityColumns.activity_occurrence,
                # bigquery
                clusterkey=f"{ActivityColumns.activity_occurrence}, {ActivityColumns.customer}",
                partition_column=f"TIMESTAMP_TRUNC({ActivityColumns.ts}, MONTH)",
                # snowflake
                cluster_column=f"({ActivityColumns.activity_occurrence} in (1, NULL), {ActivityColumns.activity_repeated_at} is NULL, to_date({ActivityColumns.ts}))",
                # posgres-specific indexes
                index_name_part=table,
                occurrence_index="ac",
                repeated_at_index="ar",
                customer_idx="c",
            )

    else:
        if flags.should_show_flag("dataset-no-occurrence", user):
            return dict(
                # distkey='ActivityColumns.customer',
                # redshift
                diststyle="EVEN",
                sortkey=f'"{ActivityColumns.activity}", "{ActivityColumns.ts}"',
                # sortmode="AUTO",
                # diststyle="AUTO",
                # MSSQL
                order_key=f"{ActivityColumns.activity}, {ActivityColumns.ts}",
                index_key=ActivityColumns.customer,
                # athena
                partitioned_by=f"{ActivityColumns.activity} VARCHAR(255), DATE({ActivityColumns.ts}) DATE",
                # databricks
                partition_by=f"{ActivityColumns.activity}",
                # bigquery
                clusterkey=f"{ActivityColumns.activity}, {ActivityColumns.customer}",
                partition_column=f"TIMESTAMP_TRUNC({ActivityColumns.ts}, MONTH)",
                # snowflake
                cluster_column=f"({ActivityColumns.activity}, to_date(ts))",
                # posgres-specific indexes
                # index_name=table
            )
        else:
            return dict(
                # distkey='ActivityColumns.customer',
                # redshift
                diststyle="EVEN",
                sortkey=f'"{ActivityColumns.activity}", "{ActivityColumns.activity_occurrence}", "{ActivityColumns.ts}"',
                # sortmode="AUTO",
                # diststyle="AUTO",
                # MSSQL
                order_key=f"{ActivityColumns.activity}, {ActivityColumns.ts}",
                index_key=ActivityColumns.customer,
                # athena
                partitioned_by=f"{ActivityColumns.activity} VARCHAR(255), {ActivityColumns.activity_occurrence} INT, DATE({ActivityColumns.ts}) DATE",
                # databricks
                partition_by=f"{ActivityColumns.activity}, {ActivityColumns.activity_occurrence}",
                # bigquery
                clusterkey=f"{ActivityColumns.activity}, {ActivityColumns.activity_occurrence}, {ActivityColumns.customer}",
                partition_column=f"TIMESTAMP_TRUNC({ActivityColumns.ts}, MONTH)",
                # snowflake
                cluster_column=f"({ActivityColumns.activity}, {ActivityColumns.activity_occurrence} in (1, NULL), {ActivityColumns.activity_repeated_at} is NULL, to_date(ts))",
                # posgres-specific indexes
                index_name=table,
                occurrence_index="ac",
                repeated_at_index="ar",
            )


def __get_parititon_by(mavis: Mavis, transform):
    """
    Gets the partition your supposed to do
    """
    partition_by = []

    # add if it is a single activity
    if not transform.single_activity:
        partition_by.append(mavis.qm.Column(table_column=ActivityColumns.activity))

    # break down if the partition has a source
    if transform.has_source:
        partition_by.append(
            mavis.qm.Column(
                function="nvl",
                fields=dict(
                    first_column=mavis.qm.Column(table_column=ActivityColumns.customer),
                    second_column=mavis.qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                ),
            )
        )
    else:
        partition_by.append(mavis.qm.Column(table_column=ActivityColumns.customer))

    return partition_by


def __remove_fake_null(qm, col):
    return qm.Column(
        case=dict(
            cases=[
                dict(
                    when=qm.Condition(
                        operator="is_in",
                        left=col,
                        right=[
                            qm.Column(value=r, column_type="string")
                            for r in ("None", "none", "", " ", "null", "NULL", "nil")
                        ],
                    ),
                    then=qm.Column(),
                )
            ],
            else_value=col,
        ),
        column_type=col.column_type,
        name_alias=col.name_alias,
    )


def _update_manually_partitioned_stream_table(mavis: Mavis, company_table, manually_partitioned):
    # get all the activities
    all_activities = [
        a
        for a in graph_client.activity_index(company_id=mavis.company.id).all_activities
        if a.table_id == company_table.id
    ]
    qm = mavis.qm

    stream_table = mavis.qm.stream_table(company_table.activity_stream)

    activity_tables = [
        (
            mavis.qm.stream_table(company_table.activity_stream, activity=a.slug),
            a.slug,
        )
        for a in all_activities
    ]

    # break up all the tables
    if manually_partitioned:
        all_tables = WarehouseManager(mavis=mavis).get_schema().tables_for(stream_table.schema)
        all_tables = [t.lower_name for t in all_tables]
        all_table_qs = []

        for at, _ in activity_tables:
            if at.table in all_tables:
                all_table_qs.append(qm.get_clear_table_query(at))
            else:
                add_ons = __get_activity_stream_add_ons(mavis.user, at.table, manually_partitioned=True)
                columns = __get_activity_columns(mavis)

                # define the create query
                all_table_qs.append(
                    qm.get_create_table_query(
                        at,
                        columns,
                        add_ons,
                    )
                )

        # run all the stuff that needs to be created
        mavis.batch_run_query(all_table_qs, raise_on_error=False)

        insert_qs = []

        # create a new ACTIVITY activity stream
        for at, activity_slug in activity_tables:
            # create the activity stream
            cols = __get_activity_columns(mavis)
            query = qm.Query()
            for c in cols:
                query.add_column(qm.Column(table_column=c["name"]))
                query.set_from(stream_table)

            query.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_column=ActivityColumns.activity),
                    right=qm.Column(value=activity_slug),
                )
            )
            insert_qs.append(mavis.qm.get_insert_query(at, query))

        # run all the inserts
        mavis.batch_run_query(insert_qs)

        # drop the main table
        mavis.run_query(qm.get_drop_table_query(stream_table, cascade=True))
    else:
        mavis.run_query(qm.get_drop_table_query(stream_table, cascade=True))

        # create the activity stream
        _create_activity_stream(mavis, company_table.activity_stream)

        all_qs = [qm.get_insert_query(stream_table, qm.wrap_query(at)) for at, _ in activity_tables]

        # insert all the data
        mavis.batch_run_query(all_qs)

        # drop all the tables
        mavis.batch_run_query(
            [qm.get_drop_table_query(at, cascade=True) for at, _ in activity_tables],
            raise_on_error=False,
        )


@tracer.start_as_current_span("get_query")
def get_query(
    mavis: Mavis,
    transform,
    include_metadata=False,
    include_casting=False,
    include_stream_cache_columns=False,
):
    query = mavis.qm.Query()

    # HACK: to deal with redshift being stupid
    if transform.kind == transform.kind.stream and mavis.qm.language == "redshift" and include_metadata:
        query.set_from(
            mavis.qm.Table(
                sql=transform.production_queries[0].sql + "\n\n limit 100000000",
                alias="s",
            )
        )
    else:
        query.set_from(mavis.qm.Table(sql=transform.production_queries[0].sql, alias="s"))

    all_names = [c.name for c in transform.column_renames]

    replace_source_id = "source_id" in all_names
    feature_cols = []
    query_combines_feature_json = False

    for c in transform.column_renames:
        column_type = None if include_casting and c.casting is not None and c.type in ("string", "text") else c.type
        casting = c.casting if include_casting else None

        # add all the columns as features
        if transform.kind == transform.kind.stream and c.name.startswith("feature_"):
            if c.name != "feature_json":
                feature_cols.append(
                    dict(
                        key=mavis.qm.Column(
                            value=utils.fix_key(c.name[8:]),
                        ).to_query(),
                        key_col=mavis.qm.Column(
                            table_column=utils.fix_key(c.name[8:]),
                        ).to_query(),
                        column=mavis.qm.Column(
                            table_column=c.name,
                            table_alias="s",
                            casting=("string" if utils.get_simple_type(c.type) == "timestamp" else None),
                        ).to_query(),
                    )
                )
            else:
                query_combines_feature_json = True
                query.add_column(mavis.qm.Column(table_column=c.name, table_alias="s", column_type="json"))

        elif c.name == ActivityColumns.customer:
            query.add_column(
                mavis.qm.Column(
                    function="lower",
                    fields=dict(
                        column=__remove_fake_null(
                            mavis.qm,
                            mavis.qm.Column(
                                table_column=c.name,
                                table_alias="s",
                                column_type=column_type,
                                casting="string",
                            ),
                        )
                    ),
                    column_type=column_type,
                    name_alias=c.name,
                )
            )

        ## backfill
        elif transform.kind == transform.kind.stream and c.name == "source":
            logger.info("Ignoring source")

        elif transform.kind == transform.kind.stream and c.name == "source_id":
            if replace_source_id:
                # also add the alternate customer id
                query.add_column(
                    __remove_fake_null(
                        mavis.qm,
                        mavis.qm.Column(
                            function="concat",
                            fields=dict(
                                first_column=mavis.qm.Column(table_column="source", table_alias="s"),
                                second_column=mavis.qm.Column(table_column="source_id", table_alias="s"),
                            ),
                            column_type=column_type,
                            casting="string" if column_type != "string" else None,
                            name_alias=ActivityColumns.anonymous_customer_id,
                        ),
                    )
                )

        elif transform.kind == transform.kind.stream and c.name == ActivityColumns.anonymous_customer_id:
            if not replace_source_id:
                query.add_column(
                    __remove_fake_null(
                        mavis.qm,
                        mavis.qm.Column(
                            table_column=c.name,
                            table_alias="s",
                            column_type=column_type,
                            casting="string",
                            name_alias=c.name,
                        ),
                    )
                )
        else:
            query.add_column(
                mavis.qm.Column(
                    table_column=c.name,
                    table_alias="s",
                    column_type=column_type,
                    casting=casting,
                    name_alias=c.name if include_casting and c.casting else None,
                )
            )

    if include_metadata:
        query.add_column(
            mavis.qm.Column(
                function="now",
                fields=dict(),
                name_alias=ActivityColumns.run_at,
                column_type="timestamp",
            )
        )
        query.add_column(
            mavis.qm.Column(
                value=transform.slug,
                casting="string",
                name_alias=_get_source_column(transform.kind),
            )
        )

    if transform.kind == transform.kind.stream and not query_combines_feature_json:
        query.add_column(
            mavis.qm.Column(
                function="to_json",
                fields=dict(
                    key_value_pair=", ".join(f'{fc["key"]}, {fc["column"]}' for fc in feature_cols),
                    value_as_key=", ".join(f'{fc["column"]} as {fc["key_col"]}' for fc in feature_cols),
                    json_pair=", ".join(f'{fc["key"]}: {fc["column"]}' for fc in feature_cols),
                ),
                name_alias="feature_json",
            )
        )

    if include_stream_cache_columns and not flags.should_show_flag("dataset-no-occurrence", mavis.user):
        # NOTE: I had to wrap the query since some customer have a source and source_id and that needs to be nested in the data
        temp_query = mavis.qm.Query()
        temp_query.set_from(mavis.qm.Table(query=query, alias="s"))
        temp_query.add_column(mavis.qm.Column(all_columns=True))
        temp_query.add_column(
            mavis.qm.Column(
                function="window_func_w_group_and_order",
                fields=dict(
                    function="LEAD",
                    column=mavis.qm.Column(table_alias="s", table_column=ActivityColumns.ts),
                    group=__get_parititon_by(mavis, transform),
                    order=mavis.qm.Column(table_alias="s", table_column=ActivityColumns.ts),
                ),
                column_type="timestamp",
                name_alias=ActivityColumns.activity_repeated_at,
            )
        )
        temp_query.add_column(
            mavis.qm.Column(
                function="row_number_w_group",
                fields=dict(
                    group=__get_parititon_by(mavis, transform),
                    order=mavis.qm.Column(table_alias="s", table_column=ActivityColumns.ts),
                ),
                column_type="number",
                name_alias=ActivityColumns.activity_occurrence,
            )
        )
        query = temp_query

    elif mavis.qm.language == "databricks":
        query.add_column(mavis.qm.Column(name_alias=ActivityColumns.activity_repeated_at))
        query.add_column(mavis.qm.Column(name_alias=ActivityColumns.activity_occurrence))

    # add the defaults
    query.add_fields(**mavis.qm.get_default_fields())

    return query


# Handlers for starting the stransformations
def _get_last_run_at(plan, activity=None):
    """
    Gets the last time every activity ran
    """
    mavis = plan.mavis
    table_name = plan.table

    # get the last run time for the query
    query = mavis.qm.Query()

    c = mavis.qm.Column(table_column=plan.get_source_column(), table_alias="l")
    query.add_column(c)
    query.add_group_by(c)

    query.add_column(
        mavis.qm.Column(
            function="max",
            fields=dict(column=mavis.qm.Column(table_column=plan.get_ts_column(), table_alias="l")),
            name_alias="max_ts",
        )
    )
    desired_table = mavis.qm.stream_table(table_name, alias="l", activity=activity)
    query.set_from(desired_table)

    return query.to_query()


def _check_table_missing(mavis: Mavis, table, e):
    lower_e = utils.get_error_message(e).lower()

    if any(k in lower_e for k in ("was not found in location", "does not exist")) and table in lower_e:
        return True
    elif "already exists" in lower_e:
        return False
    else:
        return WarehouseManager(mavis=mavis).get_schema().table(mavis.company.warehouse_schema, table) is None


def __get_activity_columns(mavis: Mavis):
    # define the extra pieces for the column
    extra = dict(
        redshift=dict(
            timestamp="ENCODE AZ64",
            number="ENCODE AZ64",
            string="ENCODE zstd",
            json="ENCODE zstd",
            small_string="ENCODE BYTEDICT",
        )
    )

    encoding = extra.get(mavis.qm.language, {})

    columns = [
        # define the meta data updatign columns
        dict(
            name=ActivityColumns.run_at,
            type="timestamp",
            extra=encoding.get("timestamp"),
        ),
        dict(
            name=ActivityColumns.activity_source,
            type="string",
            extra=encoding.get("small_string"),
        ),
        dict(
            name=ActivityColumns.anonymous_customer_id,
            type="string",
            extra=encoding.get("string"),
        ),
        dict(name=ActivityColumns.customer, type="string", extra=encoding.get("string")),
        # define the activity
        dict(
            name=ActivityColumns.activity_id,
            type="string",
            extra=encoding.get("string"),
        ),
        dict(name=ActivityColumns.ts, type="timestamp"),
        dict(
            name=ActivityColumns.activity,
            type="string",
            extra=encoding.get("small_string"),
        ),
    ]

    columns.extend(
        [
            dict(name=ActivityColumns.revenue_impact, type="float"),
            # link for a bridge
            dict(name=ActivityColumns.link, type="string", extra=encoding.get("string")),
            # cache columns
            dict(
                name=ActivityColumns.activity_repeated_at,
                type="timestamp",
                extra=encoding.get("timestamp"),
            ),
            dict(
                name=ActivityColumns.activity_occurrence,
                type="integer",
                extra=encoding.get("integer"),
            ),
        ]
    )

    # add the features at the end for backfilling (DO NOT RELOAD)
    columns.append(dict(name="feature_json", type="json", extra=encoding.get("json")))
    return columns


@tracer.start_as_current_span("_create_activity_stream")
def _create_activity_stream(
    mavis: Mavis, table, manually_partitioned=False, no_add_onds=False, do_not_run: bool = False
):
    # create schema if it is needs
    if not do_not_run:
        mavis.create_schema()
    get_current_span().set_attribute("table", table)

    if no_add_onds:
        add_ons = None
    else:
        add_ons = __get_activity_stream_add_ons(mavis.user, table, manually_partitioned=manually_partitioned)

    # get the proper columns
    columns = __get_activity_columns(mavis)
    stream_table = mavis.qm.stream_table(table)
    # define the create query
    create_query = mavis.qm.get_create_table_query(
        stream_table,
        columns,
        add_ons,
    )

    # run the query
    if do_not_run:
        return create_query.split(";")
    else:
        for q in create_query.split(";"):
            mavis.run_query(q)

    tb = TableSchema(
        schema_name=stream_table.schema,
        table_name=stream_table.table,
        columns=[c for c in columns],
    )

    # Add the table to the warehouse
    WarehouseManager(mavis=mavis).create(tb)
    return columns


@tracer.start_as_current_span("_run_customer_aliasing_v2")
def _run_customer_aliasing_v2(plan: Plan, aliasing_transformation_slugs, on_staging=True, skip_running=False):
    """Add the ability to alias activities"""
    mavis = plan.mavis
    table = plan.table
    qm = mavis.qm
    mapping_query = qm.Query()
    mapping_query.set_from(mavis.qm.stream_table(table, is_identity=True, alias="a"))

    mapping_query.add_column(qm.Column(table_column=ActivityColumns.anonymous_customer_id, table_alias="a"))
    mapping_query.add_column(qm.Column(table_column=ActivityColumns.customer, table_alias="a"))
    mapping_query.add_column(
        qm.Column(
            function="row_number_w_group",
            fields=dict(
                group=[qm.Column(table_column=ActivityColumns.anonymous_customer_id, table_alias="a")],
                order=qm.Column(table_column=ActivityColumns.ts, table_alias="a").to_query() + " desc",
            ),
            name_alias="rw",
        )
    )

    mapping_query.add_filter(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="is_in",
                    left=qm.Column(table_column=ActivityColumns.activity_source, table_alias="a"),
                    right=[qm.Column(value=a) for a in aliasing_transformation_slugs],
                )
            ]
        )
    )
    mapping_query = qm.wrap_query(mapping_query)
    mapping_query.add_filter(
        qm.Condition(operator="equal", left=qm.Column(table_column="rw"), right=qm.Column(value=1))
    )

    # update the table with the following queries
    set_conds = [
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=ActivityColumns.customer, table_alias="u"),
            right=qm.Column(table_column=ActivityColumns.customer, table_alias="a"),
        ),
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=ActivityColumns.activity_occurrence, table_alias="u"),
            right=qm.Column(value=None),
        ),
    ]

    update_filts = qm.Filter(
        filters=[
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=ActivityColumns.customer, table_alias="u"),
                right=qm.Column(
                    function="lower",
                    fields=dict(
                        column=__remove_fake_null(
                            mavis.qm,
                            mavis.qm.Column(
                                table_column=ActivityColumns.anonymous_customer_id,
                                table_alias="a",
                                column_type="string",
                                casting="string",
                            ),
                        )
                    ),
                ),
            ),
            "AND",
            qm.Condition(
                operator="not_equal",
                left=qm.Column(table_column=ActivityColumns.customer, table_alias="u"),
                right=qm.Column(table_column=ActivityColumns.customer, table_alias="a"),
            ),
        ]
    )

    # update the Identity table
    if not on_staging and not skip_running:
        update_query = qm.get_update_query(
            mavis.qm.stream_table(table, is_identity=True, alias="u"),
            set_conds[:1],
            update_filts,
            from_table=qm.Table(query=mapping_query, alias="a"),
            update_wlm_count=mavis.config.update_wlm_count,
        )

        # run the query
        mavis.run_query(update_query)

    if plan.manually_partitioned and not on_staging:
        all_updates = []
        for a in plan.activities:
            update_query = qm.get_update_query(
                mavis.qm.stream_table(table, is_staging=on_staging, alias="u", activity=a.slug),
                set_conds,
                update_filts,
                from_table=qm.Table(query=mapping_query, alias="a"),
                update_wlm_count=mavis.config.update_wlm_count,
            )

            if skip_running:
                return update_query

            # run the query
            all_updates.append(update_query)

        mavis.batch_run_query(all_updates, raise_on_error=True)

    else:
        update_query = qm.get_update_query(
            mavis.qm.stream_table(table, is_staging=on_staging, alias="u"),
            set_conds,
            update_filts,
            from_table=qm.Table(query=mapping_query, alias="a"),
            update_wlm_count=mavis.config.update_wlm_count,
        )

        if skip_running:
            return update_query

        # run the query
        mavis.run_query(update_query)


@tracer.start_as_current_span("_run_remove_customers_v2")
def _run_remove_customers_v2(
    plan: Plan,
    remove_transformation_slugs,
    is_anon=False,
    on_staging=True,
    skip_running=False,
):
    """Add the ability to alias activities"""
    mavis = plan.mavis
    table = plan.table
    # deal with customer and anonymous customer id for null values
    col = ActivityColumns.anonymous_customer_id if is_anon else ActivityColumns.customer
    qm = mavis.qm

    # Get all the data from the production activities
    temp_query = qm.Query()
    temp_col = qm.Column(table_column=col)
    if plan.manually_partitioned:
        activity_slugs = []
        for p in plan.processes:
            if p.slug in remove_transformation_slugs:
                activity_slugs.extend(p.activity_slugs)
        # create the table
        desired_table = mavis.qm.get_activity_table(
            table, activity_slugs, filters=qm.Condition(operator="not_is_null", left=temp_col)
        )
    else:
        desired_table = mavis.qm.stream_table(table)

    temp_query.set_from(desired_table)
    temp_query.add_column(temp_col)
    temp_query.set_where(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="is_in",
                    left=qm.Column(table_column=ActivityColumns.activity_source),
                    right=[qm.Column(value=a) for a in remove_transformation_slugs],
                ),
                "AND",
                qm.Condition(operator="not_is_null", left=temp_col),
            ]
        )
    )

    # remove the remove slugs
    delete_filter = qm.Filter(
        filters=[
            qm.Condition(
                operator="is_in",
                left=temp_col,
                right=temp_query,
            ),
            "AND",
            qm.Condition(
                operator="not_is_in",
                left=qm.Column(table_column=ActivityColumns.activity_source),
                right=[qm.Column(value=a) for a in remove_transformation_slugs],
            ),
        ]
    )

    # process the delete
    if plan.manually_partitioned and not on_staging:
        all_qs = []
        for a in plan.activities:
            if not is_anon or a.has_source:
                delete_query = qm.get_delete_query(
                    mavis.qm.stream_table(table, is_staging=on_staging, activity=a.slug),
                    delete_filter,
                )

                if skip_running:
                    return delete_query

                # run the delete query
                all_qs.append(delete_query)

        # run them all at the same time
        mavis.batch_run_query(all_qs)

    else:
        delete_query = qm.get_delete_query(mavis.qm.stream_table(table, is_staging=on_staging), delete_filter)

        if skip_running:
            return delete_query

        # run the delete query
        mavis.run_query(delete_query)


def _full_identity_query(mavis: Mavis, table, is_prod=False):
    # get all the identity maps
    qm = mavis.qm
    slugs = []

    if is_prod:
        base_table = mavis.qm.stream_table(table)
        # only show the ones that have data in their columns
        all_trans = graph_client.get_all_identity_transformations(company_id=mavis.company.id).all_transformations

        for t in all_trans:
            col = next(
                (c for c in t.column_renames if c.has_data and t.name == ActivityColumns.customer),
                None,
            )
            if col:
                slugs.append(t.slug)

    else:
        base_table = mavis.qm.stream_table(table, is_staging=True)

    identity_query = qm.Query()
    identity_query.set_from(base_table)
    for c in (
        "activity_id",
        ActivityColumns.anonymous_customer_id,
        ActivityColumns.customer,
        "ts",
        ActivityColumns.activity_source,
    ):
        identity_query.add_column(qm.Column(table_column=c))

    # add the filters
    identity_query.set_where(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="not_is_null",
                    left=qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                ),
                "AND",
                qm.Condition(
                    operator="not_is_null",
                    left=qm.Column(table_column=ActivityColumns.customer),
                ),
            ]
        )
    )

    if slugs:
        identity_query.add_filter(
            mavis.qm.Condition(
                operator="is_in",
                left=mavis.qm.Column(table_column=ActivityColumns.activity_source),
                right=[mavis.qm.Column(value=s) for s in slugs],
            )
        )

    return identity_query


def _dedupe_identity_query(mavis: Mavis, table, is_identity=False, is_prod=False, add_filt=None):
    qm = mavis.qm
    new_mapping = qm.Query()
    new_mapping.add_column(qm.Column(all_columns=True))
    new_mapping.add_column(
        qm.Column(
            function="lead",
            fields=dict(
                column=qm.Column(table_column=ActivityColumns.customer),
                group=[qm.Column(table_column=ActivityColumns.anonymous_customer_id)],
                order=qm.Column(table_column=ActivityColumns.ts),
            ),
            name_alias="next_customer",
        )
    )

    # we will use staging for most queries but will use the full table when it is a reconcile table
    if is_identity:
        new_mapping.set_from(mavis.qm.stream_table(table, is_identity=True))

    else:
        if is_prod:
            new_mapping.set_from(mavis.qm.stream_table(table))
        else:
            new_mapping.set_from(mavis.qm.stream_table(table, is_staging=True))

        # add the filter since it is not used identity
        new_mapping.set_where(
            qm.Filter(
                filters=[
                    qm.Condition(
                        operator="not_is_null",
                        left=qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                    ),
                    "AND",
                    qm.Condition(
                        operator="not_is_null",
                        left=qm.Column(table_column=ActivityColumns.customer),
                    ),
                ]
            )
        )

    # add undo slug
    if add_filt:
        new_mapping.add_filter(add_filt)

    # wrap the query and filter the data
    wrap_query = qm.Query()
    wrap_query.set_from(qm.Table(query=new_mapping))
    for c in (
        "activity_id",
        ActivityColumns.anonymous_customer_id,
        ActivityColumns.customer,
        "ts",
        ActivityColumns.activity_source,
    ):
        wrap_query.add_column(qm.Column(table_column=c))

    # add the where estatement for next customer
    wrap_query.set_where(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="is_null",
                    left=qm.Column(table_column="next_customer"),
                ),
                "OR",
                qm.Condition(
                    operator="not_equal",
                    left=qm.Column(table_column=ActivityColumns.customer),
                    right=qm.Column(table_column="next_customer"),
                ),
            ]
        )
    )
    return wrap_query


def __get_from_to_identity_query(mavis: Mavis, table, add_filt=None):
    qm = mavis.qm
    from_to_query = qm.Query()
    from_to_query.add_column(qm.Column(table_column=ActivityColumns.anonymous_customer_id))
    from_to_query.add_column(qm.Column(table_column=ActivityColumns.customer))
    from_to_query.set_from(qm.Table(query=_dedupe_identity_query(mavis, table, is_identity=True, add_filt=add_filt)))

    from_to_query.add_column(
        qm.Column(
            case=dict(
                cases=[
                    dict(
                        when=qm.Condition(
                            operator="is_null",
                            left=qm.Column(
                                function="lag",
                                fields=dict(
                                    column=qm.Column(table_column=ActivityColumns.ts),
                                    group=[qm.Column(table_column=ActivityColumns.anonymous_customer_id)],
                                    order=qm.Column(table_column=ActivityColumns.ts),
                                ),
                            ),
                        ),
                        then=qm.Column(value="1970-01-01", casting="timestamp"),
                    )
                ],
                else_value=qm.Column(
                    function="time_add",
                    fields=dict(
                        column=qm.Column(table_column=ActivityColumns.ts),
                        number=-30,
                        datepart="minute",
                    ),
                ),
            ),
            name_alias="last_ts",
        )
    )

    # add the next_ts
    from_to_query.add_column(
        qm.Column(
            function="nvl",
            fields=dict(
                first_column=qm.Column(
                    function="lead",
                    fields=dict(
                        column=qm.Column(
                            function="time_add",
                            fields=dict(
                                column=qm.Column(table_column=ActivityColumns.ts),
                                number=-30,
                                datepart="minute",
                            ),
                        ),
                        group=[qm.Column(table_column=ActivityColumns.anonymous_customer_id)],
                        order=qm.Column(table_column=ActivityColumns.ts),
                    ),
                ),
                second_column=qm.Column(value="2200-01-01", casting="timestamp"),
            ),
            name_alias="next_ts",
        )
    )

    return from_to_query


@tracer.start_as_current_span("_compute_cache_columns_v2")
def _compute_cache_columns_v2(
    plan: Plan,
    do_not_update_activities=None,
    only_update_activities=None,
    is_reconcile=False,
    skip_running=False,
):
    """
    WE DO NOT RUN THIS ON STG
        - ndealling with misddle dat and more layers
    """
    span = get_current_span()
    activities = ",".join(only_update_activities or []) or "ALL"
    span.set_attribute("activities", activities)

    mavis = plan.mavis
    table = plan.table
    qm = mavis.qm
    activity_column = qm.Column(table_column=ActivityColumns.activity, table_alias="s")
    current_table = mavis.qm.stream_table(table, alias="s")

    # create the new cache_query
    cache_query = qm.Query()
    cache_query.set_from(current_table)

    if is_reconcile:
        affected_users = create_single_row_table(
            mavis,
            mavis.qm.stream_table(table),
            __get_person_column(mavis),
        )
        affected_users.add_filter(
            qm.Condition(
                operator="is_null",
                left=qm.Column(table_column=ActivityColumns.activity_occurrence),
            )
        )
    else:
        affected_users = create_single_row_table(
            mavis,
            mavis.qm.stream_table(table, is_staging=True),
            __get_person_column(mavis),
        )

    cache_query.add_filter(
        qm.Condition(
            operator="is_in",
            left=__get_person_column(mavis, "s"),
            right=affected_users,
        ),
    )

    cache_query.add_column(
        [
            qm.Column(table_column=c, table_alias="s")
            for c in (
                "activity_id",
                "activity",
                "ts",
                ActivityColumns.activity_occurrence,
                ActivityColumns.activity_repeated_at,
            )
        ]
    )
    # add the next activity_reperated at
    cache_query.add_column(
        qm.Column(
            function="lead",
            fields=dict(
                column=qm.Column(table_column=ActivityColumns.ts, table_alias="s"),
                group=[activity_column, __get_person_column(mavis, "s")],
                order=qm.Column(table_column=ActivityColumns.ts, table_alias="s"),
            ),
            table_alias="s",
            name_alias="new_activity_repeated_at",
        )
    )

    # add the next new occurrence
    cache_query.add_column(
        qm.Column(
            function="row_number_w_group",
            fields=dict(
                group=[activity_column, __get_person_column(mavis, "s")],
                order=qm.Column(table_column=ActivityColumns.ts, table_alias="s"),
            ),
            table_alias="s",
            name_alias="new_activity_occurrence",
        )
    )

    main_query = qm.Query()
    main_query.add_comment("prepares the query for update")
    # add the columns
    main_query.add_column(qm.Column(all_columns=True))
    main_query.set_from(qm.Table(query=cache_query))

    # filter the rows that came out to be the same
    full_filter = qm.Filter(
        filters=[
            qm.Condition(
                operator="is_null",
                left=qm.Column(table_column=ActivityColumns.activity_occurrence),
            ),
            "OR",
            qm.Condition(
                operator="not_equal",
                left=qm.Column(
                    function="nvl",
                    fields=dict(
                        first_column=qm.Column(table_column=ActivityColumns.activity_occurrence),
                        second_column=qm.Column(value=0),
                    ),
                ),
                right=qm.Column(table_column="new_activity_occurrence"),
            ),
            "OR",
            qm.Condition(
                operator="not_equal",
                left=qm.Column(
                    function="nvl",
                    fields=dict(
                        first_column=qm.Column(table_column=ActivityColumns.activity_repeated_at),
                        second_column=qm.Column(value=START_TIME, casting="timestamp"),
                    ),
                ),
                right=qm.Column(table_column="new_activity_repeated_at"),
            ),
        ]
    )

    # add the ability to remove activities that we want to ignore
    if do_not_update_activities and not plan.manually_partitioned:
        main_query.set_where(
            qm.Filter(
                filters=[
                    full_filter,
                    "AND",
                    qm.Condition(
                        operator="not_is_in",
                        left=qm.Column(table_column=ActivityColumns.activity),
                        right=[qm.Column(value=r_slug) for r_slug in do_not_update_activities],
                    ),
                ]
            )
        )
    elif only_update_activities and not plan.manually_partitioned:
        main_query.set_where(
            qm.Filter(
                filters=[
                    full_filter,
                    "AND",
                    qm.Condition(
                        operator="is_in",
                        left=qm.Column(table_column=ActivityColumns.activity),
                        right=[qm.Column(value=r_slug) for r_slug in only_update_activities],
                    ),
                ]
            )
        )
    else:
        main_query.set_where(full_filter)

    set_cond = [
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=ActivityColumns.activity_occurrence, table_alias="u"),
            right=qm.Column(table_column="new_activity_occurrence", table_alias="s"),
        ),
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=ActivityColumns.activity_repeated_at, table_alias="u"),
            right=qm.Column(table_column="new_activity_repeated_at", table_alias="s"),
        ),
    ]

    update_filt = qm.Filter(
        filters=[
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=ActivityColumns.activity, table_alias="u"),
                right=qm.Column(table_column=ActivityColumns.activity, table_alias="s"),
            ),
            "AND",
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=ActivityColumns.activity_id, table_alias="u"),
                right=qm.Column(table_column=ActivityColumns.activity_id, table_alias="s"),
            ),
        ]
    )

    sql_mapper = dict()

    if plan.manually_partitioned:
        update_filt.filters = update_filt.filters[-1:]

        for a in plan.activities:
            if not is_reconcile and a.row_count == 0:
                continue

            if a.slug in (do_not_update_activities or []):
                continue

            # allow limited updates as well
            if only_update_activities and a.slug not in only_update_activities:
                continue

            # handle the reconcile code
            if is_reconcile:
                affected_users.set_from(mavis.qm.stream_table(table, activity=a.slug))

            update_table = mavis.qm.stream_table(table, alias="s", activity=a.slug)
            cache_query.set_from(update_table)

            # setup the update query
            update_query = qm.get_update_query(
                mavis.qm.stream_table(table, alias="u", activity=a.slug),
                set_cond,
                deepcopy(update_filt),
                from_table=qm.Table(query=main_query, alias="s"),
                update_wlm_count=mavis.config.update_wlm_count,
            )

            # this is just for tests
            if skip_running:
                return update_query

            sql_mapper[update_query] = a

            # update the manually partitioned table if the insert is large before running the update so the update is way faster
            if a.row_count > mavis.config.max_inserts:
                run_clean(mavis, [update_table])

    else:
        # setup the update query
        update_query = qm.get_update_query(
            mavis.qm.stream_table(table, alias="u"),
            set_cond,
            update_filt,
            from_table=qm.Table(query=main_query, alias="s"),
            update_wlm_count=mavis.config.update_wlm_count,
        )

        if skip_running:
            return update_query

        sql_mapper[update_query] = None

    # run all the activities in batch
    errors, _ = mavis.batch_run_query(list(sql_mapper.keys()), raise_on_error=False)

    # trigger validation for errors
    all_as = []
    for e in errors:
        a = sql_mapper[e["query"]]
        if a is None:
            # the main query failed so lets update everything independently
            if only_update_activities:
                # if it is only a couple of activities then just update the data
                all_as.extend([a for a in plan.activities if a.row_count and a.slug in only_update_activities])
            elif not plan.manually_partitioned:
                for a in plan.activities:
                    # make sure we don't try an update something that already has an update
                    if a.row_count and a.slug not in (do_not_update_activities or []):
                        _compute_cache_columns_v2(
                            plan,
                            only_update_activities=[a.slug],
                            is_reconcile=is_reconcile,
                        )
            else:
                # I need to do this so when this happens it won't update it and remove the duplication
                do_not_update_activities.append(a.slug)

        else:
            all_as.append(a)

    # trigger validation
    if all_as:
        tasks = CustomTask(mavis.company.s3, TaskKindEnum.validation)
        for a in all_as:
            # add the task for all updated activities
            tasks.add_task("validate_activity", activity_id=a.id)

        tasks.update()

        # trigger the task
        plan.require_validate_to_run = True


@tracer.start_as_current_span("_run_identity_resolution_v2")
def _run_identity_resolution_v2(plan, ignore_slugs=None, on_staging=False, skip_running=False):
    mavis = plan.mavis
    table = plan.table
    qm = mavis.qm
    from_to_query = __get_from_to_identity_query(mavis, table)
    # create the update filter
    update_filter = qm.Filter(
        filters=[
            qm.Condition(
                operator="not_equal",
                left=qm.Column(table_column="last_ts", table_alias="a"),
                right=qm.Column(table_column="next_ts", table_alias="a"),
            ),
            "AND",
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=ActivityColumns.anonymous_customer_id, table_alias="u"),
                right=qm.Column(table_column=ActivityColumns.anonymous_customer_id, table_alias="a"),
            ),
            "AND",
            qm.Condition(
                operator="not_equal",
                left=qm.Column(
                    function="nvl",
                    fields=dict(
                        first_column=qm.Column(table_column=ActivityColumns.customer, table_alias="u"),
                        second_column=qm.Column(value=""),
                    ),
                ),
                right=qm.Column(table_column=ActivityColumns.customer, table_alias="a"),
            ),
            "AND",
            qm.Condition(
                operator="greater_than",
                left=qm.Column(table_column=ActivityColumns.ts, table_alias="u"),
                right=qm.Column(table_column="last_ts", table_alias="a"),
            ),
            "AND",
            qm.Condition(
                operator="less_than_equal",
                left=qm.Column(table_column=ActivityColumns.ts, table_alias="u"),
                right=qm.Column(table_column="next_ts", table_alias="a"),
            ),
        ]
    )

    # add the filters
    if ignore_slugs:
        update_filter.add_filter(
            qm.Condition(
                operator="not_is_in",
                left=qm.Column(table_column=ActivityColumns.activity_source, table_alias="u"),
                right=[qm.Column(value=a) for a in ignore_slugs],
            )
        )

    set_cond = [
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=ActivityColumns.customer, table_alias="u"),
            right=qm.Column(table_column=ActivityColumns.customer, table_alias="a"),
        )
    ]
    # do not bother to update occurrence if no occurrence is needed
    if not flags.should_show_flag("dataset-no-occurrence", plan.mavis.user):
        set_cond.append(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=ActivityColumns.activity_occurrence, table_alias="u"),
                right=qm.Column(value=None),
            )
        )

    # get the full update query
    all_qs = []

    if plan.manually_partitioned and not on_staging:
        for a in plan.activities:
            # don't bother updating things that don't have the slug
            if a.has_source and any(t_slug not in (ignore_slugs or []) for t_slug in a.transformation_slugs):
                update_query = qm.get_update_query(
                    mavis.qm.stream_table(table, is_staging=on_staging, alias="u", activity=a.slug),
                    set_cond,
                    deepcopy(update_filter),
                    from_table=qm.Table(query=from_to_query, alias="a"),
                    update_wlm_count=mavis.config.update_wlm_count,
                )

                if skip_running:
                    return update_query

                all_qs.append(update_query)
    else:
        update_query = qm.get_update_query(
            mavis.qm.stream_table(table, is_staging=on_staging, alias="u"),
            set_cond,
            update_filter,
            from_table=qm.Table(query=from_to_query, alias="a"),
            update_wlm_count=mavis.config.update_wlm_count,
        )

        if skip_running:
            return update_query

        all_qs.append(update_query)

    # batch all the runs
    mavis.batch_run_query(all_qs)


def _should_full_identity_run(mavis, table, add_filt=None, skip_running=False):
    qm = mavis.qm

    # create the opposite of the filt
    if add_filt:
        not_filt = deepcopy(add_filt)
        not_filt.is_not = True
    else:
        not_filt = None

    current_query = __get_from_to_identity_query(mavis, table, add_filt=not_filt)
    new_mapping_query = qm.Query()
    new_mapping_query.add_column(qm.Column(all_columns=True))
    if add_filt:
        new_mapping_query.set_from(mavis.qm.stream_table(table, is_identity=True))
        new_mapping_query.set_where(add_filt)
    else:
        new_mapping_query.set_from(mavis.qm.stream_table(table, is_staging=True))
        new_mapping_query.set_where(
            qm.Filter(
                filters=[
                    qm.Condition(
                        operator="not_is_null",
                        left=qm.Column(table_column=ActivityColumns.anonymous_customer_id),
                    ),
                    "AND",
                    qm.Condition(
                        operator="not_is_null",
                        left=qm.Column(table_column=ActivityColumns.customer),
                    ),
                ]
            )
        )

    count_query = qm.Query()
    count_query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    count_query.set_from(qm.Table(query=new_mapping_query, alias="n"))
    count_query.add_join(
        qm.Join(
            kind="LEFT",
            table=qm.Table(query=current_query, alias="o"),
            condition=qm.Filter(
                filters=[
                    qm.Condition(
                        operator="equal",
                        left=qm.Column(
                            table_column=ActivityColumns.anonymous_customer_id,
                            table_alias="n",
                        ),
                        right=qm.Column(
                            table_column=ActivityColumns.anonymous_customer_id,
                            table_alias="o",
                        ),
                    ),
                    "AND",
                    qm.Condition(
                        operator="equal",
                        left=qm.Column(table_column=ActivityColumns.customer, table_alias="n"),
                        right=qm.Column(table_column=ActivityColumns.customer, table_alias="o"),
                    ),
                    "AND",
                    qm.Condition(
                        operator="greater_than",
                        left=qm.Column(table_column=ActivityColumns.ts, table_alias="n"),
                        right=qm.Column(table_column="last_ts", table_alias="o"),
                    ),
                    "AND",
                    qm.Condition(
                        operator="less_than",
                        left=qm.Column(table_column=ActivityColumns.ts, table_alias="n"),
                        right=qm.Column(table_column="next_ts", table_alias="o"),
                    ),
                ]
            ),
        )
    )
    count_query.set_where(
        qm.Condition(
            operator="is_null",
            left=qm.Column(table_column=ActivityColumns.anonymous_customer_id, table_alias="o"),
        )
    )

    # added skip running for tests
    if skip_running:
        return count_query.to_query()

    try:
        data = mavis.run_query(count_query.to_query())
    except QueryRunError as e:
        table_missing = _check_table_missing(mavis, table, e)
        if table_missing:
            return False
        else:
            raise e
    return data.rows[0]["total_rows"] > 0


@tracer.start_as_current_span("_prepare_identity_resolution")
def _prepare_identity_resolution(plan, table):
    qm = plan.mavis.qm
    mavis: Mavis = plan.mavis
    # add the identity data
    customer_table = mavis.qm.stream_table(table, is_identity=True)
    new_mapping_query = _full_identity_query(mavis, table)

    # better handling of running identity
    try:
        run_idenity_full = _should_full_identity_run(mavis, table)
        mavis.run_query(qm.get_insert_query(customer_table, new_mapping_query))

    except QueryRunError as e:
        # if the data is missing then add the data from the activity stream
        table_missing = _check_table_missing(mavis, customer_table.table, e)
        if table_missing:
            # create a manually partitioned activity from all the tables
            if plan.manually_partitioned:
                activities = [a for a in plan.activities if a.has_source]
                if activities:
                    a = activities[0]
                    mavis.run_query(
                        qm.get_create_table_query(
                            customer_table,
                            query=_dedupe_identity_query(
                                mavis,
                                mavis.qm.stream_table(table, activity=a.slug).table,
                                is_prod=True,
                            ),
                            add_ons=__get_activity_stream_add_ons(mavis.user, table, is_identity=True),
                        )
                    )

                    for a in activities[1:]:
                        mavis.run_query(
                            qm.get_insert_query(
                                customer_table,
                                _dedupe_identity_query(
                                    mavis,
                                    mavis.qm.stream_table(table, activity=a.slug).table,
                                    is_prod=True,
                                ),
                            )
                        )

            else:
                query = qm.get_create_table_query(
                    customer_table,
                    query=_dedupe_identity_query(mavis, table, is_prod=True),
                    add_ons=__get_activity_stream_add_ons(mavis.user, table, is_identity=True),
                )
                mavis.run_query(query)
            # add the staging data
            mavis.run_query(qm.get_insert_query(customer_table, new_mapping_query))
            run_idenity_full = True
        else:
            raise e

    return run_idenity_full


def __get_casting(transform, col_name):
    return next((c.casting for c in transform.column_renames if c.name == col_name), None)


def external_person_column(*args, **kwargs):
    return __get_person_column(*args, **kwargs)


def __get_person_column(mavis: Mavis, alias=None, is_flipped=False):
    if is_flipped:
        cols = (ActivityColumns.anonymous_customer_id, ActivityColumns.customer)
    else:
        cols = (ActivityColumns.customer, ActivityColumns.anonymous_customer_id)

    return mavis.qm.Column(
        function="nvl",
        fields=dict(
            first_column=mavis.qm.Column(table_column=cols[0], table_alias=alias),
            second_column=mavis.qm.Column(table_column=cols[1], table_alias=alias),
        ),
        name_alias="person",
    )


@tracer.start_as_current_span("handle_error_with_maintenance")
def handle_error_with_maintenance(
    plan: Plan,
    maintenance_kind,
    activity_obj=None,
    process: ProcessUpdate = None,
    error=None,
    notes=None,
    email_override=None,
):
    mavis: Mavis = plan.mavis
    trans_updator = TransformationManager(mavis=mavis)
    activity_updator = ActivityManager(mavis=mavis)
    error = str(error)
    # ignore if it is the same maintenance
    # deal with resynced and cascade do not overlaz
    if (
        process
        and process.maintenance_kind is not None
        and maintenance_kind is not None
        and (
            process.maintenance_kind.value == maintenance_kind.value
            or (
                maintenance_kind == maintenance_kind.cascade_resynced
                and process.maintenance_kind == process.maintenance_kind.resynced
            )
        )
    ):
        if notes and process.maintenance_notes != notes:
            trans_updator.update_maintenance(process.transformation_id, process.maintenance_id, notes)

        # this is a copy of the below
        if error != "None" and process.maintenance_notes.endswith(error):
            # update the notes
            trans_updator.update_maintenance(
                process.transformation_id,
                process.maintenance_id,
                f"The transformation {process.name} query is failing with the error: {str(error)}",
            )

        return None

    # deal with each maintenance kind
    match maintenance_kind:
        case maintenance_kind.query_failed:
            # if it is a query fail then handle it (NOTE: You must update the above if you change this)
            temp_notes = f"The transformation {process.name} query is failing with the error: {str(error)}"

        case maintenance_kind.resynced:
            temp_notes = f"The transformation {process.name} being pushed to production and is currently resyncing."

        case maintenance_kind.cascade_resynced:
            temp_notes = f"The transformation {process.name} is resyncing because of a dependent transformation."

        case maintenance_kind.duplicated_id:
            temp_notes = "Data is updating but all post insert processing (identity resolution, cache column computation, etc..) is failing due to duplicate ids.   No new data will show up in dataset"

    # use the note from the input or the default one
    notes = notes or temp_notes

    if notes:
        # if the activity is under maintenance then update it
        if activity_obj and activity_obj.maintenance_id:
            activity_updator.end_maintenance(activity_obj.id)

        # if the activity is under maintenance then update it
        if process and process.maintenance_id:
            trans_updator.end_maintenance(process.transformation_id)
            for a in process.activity_ids:
                activity_updator.end_maintenance(a)

        # if it a resync or cascade or
        if maintenance_kind == maintenance_kind.duplicated_id:
            if not activity_obj:
                raise SilenceError("Duplicate Id error fired without activity")
            activities = [activity_obj]
            transformation = []
        else:
            activities = [a for a in plan.activities if a.id in process.activity_ids]
            transformation = [process]

        for a in activities:
            # Add a new activity maintenance
            # if it is not in maintenance
            if a.maintenance_id is None:
                res = activity_updator.create_maintenance(
                    a.id,
                    maintenance_kind,
                    notes,
                    error,
                    email_override=list(set([p.owner for p in plan.processes if a.id in p.activity_ids and p.owner])),
                )

                # update the object
                _copy_attr(a, res)

        # deal with the transformation
        for t in transformation:
            # Add a new activity maintenance
            res = trans_updator.create_maintenance(t.transformation_id, maintenance_kind, notes, error, t.owner)

            # update the object
            _copy_attr(t, res)


@tracer.start_as_current_span("check_and_reun_transformations")
def check_and_reun_transformations(mavis: Mavis):
    # check if there is anything waiting to be processed
    transformations = [
        t
        for t in graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations
        if t.production_queries_aggregate.aggregate.count > 0
    ]

    task_ids = set(
        [
            t.task_id
            for t in transformations
            if (t.next_resync_at is not None or any(mt for mt in t.transformation_maintenances if is_resync(mt.kind)))
            and t.task_id is not None
        ]
    )
    for ii, task_id in enumerate(task_ids):
        run_transformations.send_with_options(
            kwargs=dict(
                company_slug=mavis.company.slug,
                task_id=task_id,
            ),
            delay=60_000 * (ii + 1),  # 1 minute
        )


def _get_transformations_to_run(transformations, is_async):
    # if it is a materialized view not in the stream and it is async then run it
    valid_transforms = []
    for t in transformations:
        # if it is an async and it is a materialized view that is not a stream
        # OR not is_async and not a materlaized view and stream
        if is_async and t.update_type in ASYNC_TYPES or (not is_async and t.update_type not in ASYNC_TYPES):
            valid_transforms.append(t)

    return valid_transforms


def _copy_attr(obj, new_value):
    if isinstance(new_value, list):
        if len(new_value) == 0:
            return None
        else:
            new_value = new_value[0]

    # update the object
    for k in ("ended_at", "started_at", "id", "kind", "notes"):
        setattr(
            obj,
            f"maintenance_{k}",
            getattr(new_value, k) if new_value and hasattr(new_value, k) else None,
        )
