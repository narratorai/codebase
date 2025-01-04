from batch_jobs.custom_task import CustomTask, TaskKindEnum
from batch_jobs.data_management.run_transformations import get_query
from core.api.customer_facing.activities.utils import ActivityManager
from core.api.customer_facing.sql.utils import DimUpdator
from core.api.customer_facing.tables.utils import TableManager
from core.constants import MISSING_DATA_EMAIL_TEMPLATE
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import maintenance_kinds_enum
from core.logger import get_logger
from core.util.email import send_email
from core.utils import date_add, max_values, utcnow
from core.v4 import data_debugger
from core.v4.mavis import Mavis

logger = get_logger()


def get_owners(dim=None, activity=None, activity_transforms=None, user_emails=None):
    # get the emails to notify the customer
    owner_emails = []

    if activity_transforms:
        owner_emails.extend([t.production_queries[0].updated_by for t in activity_transforms])

    maintainer_ids = []

    if activity:
        maintainer_ids.extend([activity.company_table.maintainer_id, activity.maintainer_id])

    if dim:
        # add the activities it is used in
        for a in dim.activities or []:
            maintainer_ids.append(a.activity.maintainer_id)

        # Add the Activity stream it is a customer table for
        for ca in dim.customer_table or []:
            maintainer_ids.append(ca.maintainer_id)

        # Add the Activity stream it is aggregating
        for ca in dim.company_table_aggregations or []:
            maintainer_ids.append(ca.company_table.maintainer_id)

    if user_emails:
        owner_emails.extend([user_emails[m_id] for m_id in maintainer_ids if m_id and user_emails.get(m_id)])
    else:
        for m_id in maintainer_ids:
            if m_id:
                owner_emails.append(graph_client.get_user(id=m_id).user_by_pk.email)

    if not owner_emails:
        owner_emails = ["support@narrator.ai"]

    # owner_emails = ["ahmed@narrator.ai"]
    return list(set(owner_emails))


def _handle_debug_results(
    mavis: Mavis,
    debug_results,
    maintenances,
    owner_emails,
    activity=None,
    dim=None,
    transformation_id=None,
):
    activity_updator = ActivityManager(mavis=mavis)
    dim_updator = DimUpdator(mavis=mavis)
    maintence_dup = next((a for a in maintenances if a.kind == a.kind.duplicated_id), None)

    # if it is not duplicated then reprocess the data
    if maintence_dup and not debug_results.has_duplicates:
        # end the maintenance if it had it
        activity_updator.end_maintenance(activity.id if activity is not None else dim.id, owner_emails)
        # deal with the activity
        if activity:
            # Resync all the transformations
            all_dependencies = graph_client.get_activity_dependencies(id=activity.id).activity_by_pk

            # rerun all materialization of that activity
            for d in all_dependencies.datasets:
                # rerun all the materializations beting used
                for m in d.dataset.materializations:
                    if m.task_id:
                        from batch_jobs.data_management.materialize_dataset import (
                            materialize_dataset,
                        )

                        materialize_dataset.send(
                            company_slug=mavis.company.slug,
                            materialization_id=m.id,
                            task_id=m.task_id,
                        )

                # process all the Narratives that are being used
                for n in d.dataset.dependent_narratives:
                    if n.narrative.task_id:
                        from batch_jobs.data_management.run_narrative import (
                            run_narrative,
                        )

                        run_narrative.send(
                            company_slug=mavis.company.slug,
                            slug=n.narrative.slug,
                            task_id=n.narrative.task_id,
                        )

        return True
    # check if the duplicates are found and deal with it properly
    elif debug_results.has_duplicates and not debug_results.retry and not maintence_dup:
        notes = debug_results.notes or f"Duplication found in this {'activity' if activity else 'dimension table'}"
        if activity is not None:
            activity_updator.create_maintenance(
                activity_id=activity.id,
                kind=maintenance_kinds_enum.duplicated_id,
                notes=notes,
                error=None,
                email_override=owner_emails,
            )
        elif dim is not None:
            dim_updator.create_maintenance(
                dim_id=dim.id,
                kind=maintenance_kinds_enum.duplicated_id,
                notes=notes,
                error=None,
                email_override=owner_emails,
            )
        return True
    return None


def validate_activities(mavis: Mavis, just_activity_id=None):
    trigger_reprocess = []

    # get all the activities
    all_activities = graph_client.activity_index(company_id=mavis.company.id).all_activities

    current_streams = {activity.company_table.activity_stream for activity in all_activities}

    # delete any tables that is not used
    for ct in mavis.company.tables:
        if ct.activity_stream not in current_streams:
            try:
                TableManager(mavis=mavis).delete(ct.id)
            except Exception:
                logger.exception(f"Error deleting {ct.activity_stream}")

    all_queries = {}
    prod_queries = {}

    for activity in all_activities:
        if just_activity_id and just_activity_id != activity.id:
            continue

        # deal with the edge case
        if len(activity.activity_maintenances) > 1:
            # END THEM ALL
            graph_client.end_activity_maintenance(activity_id=activity.id)

        prod_query = mavis.qm.get_activity_query(mavis.company.table(activity.table_id), activity.slug, alias="s")

        # add time filter
        if (
            not just_activity_id
            and mavis.company.dataset_row_threshold
            and activity.row_count
            and activity.row_count > mavis.company.dataset_row_threshold * 10**6
        ):
            prod_query.add_filter(
                mavis.qm.Condition(
                    operator="greater_than",
                    left=mavis.qm.Column(table_column="ts", table_alias="s"),
                    right=mavis.qm.Column(
                        value=date_add(utcnow()[:10], "month", -6),
                        casting="timestamp",
                    ),
                )
            )

        q = data_debugger.should_debug_pkey(mavis.qm, "activity_id", prod_query)
        # add the queries
        all_queries[q] = activity
        prod_queries[q] = prod_query

    # run all the queries in batch
    queries = list(all_queries.keys())
    _, query_results = mavis.batch_run_query(queries, raise_on_error=False)

    # get all the users to avoid a million requests
    all_users = graph_client.get_all_users(company_id=mavis.company.id).user
    user_emails = {u.id: u.email for u in all_users}

    for q, activity in all_queries.items():
        if query_results.get(q) and query_results[q].total_rows == 0:
            _handle_debug_results(
                mavis,
                data_debugger.DuplicatesResults(),
                activity.activity_maintenances,
                get_owners(activity=activity, user_emails=user_emails),
                activity=activity,
            )
            continue

        prod_query = prod_queries[q]

        # get the Transforms
        activity_transforms = [
            t.transformation
            for t in graph_client.get_transformations_for_activity(activity_id=activity.id).transformation_activities
            if t.transformation.production_queries
        ]

        # GET THE query for the transforms
        transformation_query = mavis.qm.get_union_query(
            [
                get_query(
                    mavis,
                    at,
                    include_casting=True,
                    include_metadata=True,
                )
                for at in activity_transforms
            ]
        )

        try:
            # debug the results
            debug_results = data_debugger.debug_duplication_pkey(
                mavis,
                prod_query,
                "activity_id",
                transformation_query=transformation_query,
            )
        except Exception:
            logger.exception(f"{activity.name} errored")
            continue

        # handle maintenance
        _handle_debug_results(
            mavis,
            debug_results,
            activity.activity_maintenances,
            get_owners(activity=activity, activity_transforms=activity_transforms),
            activity=activity,
            transformation_id=(activity_transforms[0].id if activity_transforms else None),
        )

        if debug_results.retry:
            trigger_reprocess.extend(at.task_id for at in activity_transforms)
    return trigger_reprocess


def validate_all_dims(mavis: Mavis):
    trigger_reprocess = []

    # Process the data
    all_dims = graph_client.get_dims_with_dependencies(company_id=mavis.company.id).dim_tables
    all_enrichment = graph_client.get_enrichment_tables(company_id=mavis.company.id).all_transformations

    for dim in all_dims:
        is_used = False
        is_changing = False

        if dim.activities:
            is_used = True
            if all(a.slowly_changing_ts_column for a in dim.activities):
                is_changing = True

        if dim.customer_table or dim.company_table_aggregations:
            is_used = True

        if dim.slowly_changing_customer_dims:
            is_used = True
            if all(sd.slowly_changing_ts_column for sd in dim.slowly_changing_customer_dims):
                is_changing = True

        # if it is not being used then don't bother diff the id
        if not is_used:
            graph_client.delete_dim(id=dim.id)
            continue
        # nothing to check if it is None
        elif dim.join_key is None or is_changing:
            continue

        table = mavis.qm.Table(schema=dim.schema_ or mavis.company.warehouse_schema, table=dim.table)
        prod_query = mavis.qm.wrap_query(table)

        # create the enrichment transformation
        all_trans = [
            t
            for t in all_enrichment
            if t.table == dim.table
            and t.production_queries
            and (dim.schema_ is None or dim.schema_ == mavis.company.warehouse_schema)
        ]
        transformation_query = mavis.qm.get_union_query(
            [get_query(mavis, at, include_casting=True, include_metadata=True) for at in all_trans]
        )

        # if all the transformations are materialized view then don't bother
        if (
            not dim.maintenances
            and all_trans
            and all(t.update_type in (t.update_type.view, t.update_type.materialized_view) for t in all_trans)
        ):
            continue

        # check the table for duplication
        try:
            # debug the results
            debug_results = data_debugger.debug_duplication_pkey(
                mavis,
                prod_query,
                dim.join_key,
                transformation_query=transformation_query,
            )
        except Exception:  # noqa: S112
            continue

        # handle maintenance
        changed_state = _handle_debug_results(
            mavis,
            debug_results,
            dim.maintenances,
            get_owners(dim=dim, activity_transforms=all_trans),
            dim=dim,
            transformation_id=all_trans[0].id if all_trans else None,
        )

        # retry dims
        if debug_results.retry or changed_state:
            trigger_reprocess.extend(transform.task_id for transform in all_trans)

    return trigger_reprocess


def check_missing_data(mavis: Mavis):
    all_transforms = [
        t
        for t in graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations
        if t.production_queries_aggregate.aggregate.count > 0
        and t.update_type == t.update_type.regular
        and t.kind in (t.kind.stream, t.kind.enrichment)
    ]

    log_path = ["run_transformation", "validations.json"]
    try:
        log_dict = mavis.get_file(log_path)
    except Exception:
        log_dict = {}

    new_tasks = []

    # IF INCREMENTAL test for data out of order (random 15 days)
    # ALERT THE data in past
    for transform in all_transforms:
        try:
            remove_slugs = [tt for tt in all_transforms if tt.remove_customers and tt.table == transform.table]

            current_trans = graph_client.get_transformation_for_processing(id=transform.id).transformation

            debug_results = data_debugger.debug_incremental_old_data(mavis, current_trans, remove_slugs)

            if debug_results.has_missing:
                log_dict[transform.id] = log_dict.get(transform.id, 0) + 1

                if log_dict[transform.id] > 10:
                    # TODO: move it to maintenance and figure out how to turn it off
                    send_email(
                        mavis.company,
                        "ahmed@narrator.ai",
                        MISSING_DATA_EMAIL_TEMPLATE,
                        dict(
                            transformation_id=transform.id,
                            transformation_name=transform.name,
                            table=transform.table,
                            notes=debug_results.notes,
                            table_name=transform.table,
                            kind=transform.kind.value,
                            day_window=debug_results.day_window,
                        ),
                        tag="maintenance_email",
                    )
                else:
                    # if it is a lot of data then reprocess the window
                    if max_values([a.activity.row_count or 0 for a in transform.activities]) > mavis.config.max_inserts:
                        from_resync_time = date_add(
                            debug_results.start_date,
                            "day",
                            -debug_results.day_window * log_dict[transform.id],
                        )

                        to_resync_time = date_add(
                            debug_results.end_date,
                            "day",
                            debug_results.day_window * log_dict[transform.id],
                        )
                    else:
                        from_resync_time = "1900-01-01"
                        to_resync_time = date_add(utcnow(), "day", -debug_results.max_days)

                    new_tasks.append(
                        dict(
                            task="resync_part",
                            table=transform.table,
                            from_resync_time=from_resync_time,
                            to_resync_time=to_resync_time,
                            delete_data=False,
                            all_transformations=[transform.id],
                        )
                    )
            else:
                log_dict[transform.id] = 0
        except Exception:
            logger.exception(f"{transform.name} errored")
            continue

    # Add the tasks to processing
    if new_tasks:
        mavis.update_run_transformation_tasks(dict(tasks=new_tasks))

    # update the log
    mavis.upload_object(log_dict, log_path)


@mutex_task(check_args=False, time_limit=43_000_000)
@with_mavis
def validate_stream_assumptions(mavis: Mavis, skip_activities: bool = False, skip_dims: bool = False, **kwargs):
    """
    Validate the assumptions of the activity stream
    """
    trigger_runs = []
    run_all = True

    # Manage tasks that can be triggered from run_transformations
    tasks = CustomTask(mavis.company.s3, TaskKindEnum.validation)
    compled_activity_ids = []

    for t in tasks.tasks:
        if (
            t.task == "validate_activity"
            and t.details.get("activity_id")
            and t.details["activity_id"] not in compled_activity_ids
        ):
            trigger_run = validate_activities(mavis, just_activity_id=t.details["activity_id"])
            trigger_runs.extend(trigger_run)
            t.completed = True

            # add the activity
            compled_activity_ids.append(t.details["activity_id"])
            run_all = False
            tasks.update()

    # Regular processing
    if run_all:
        if not skip_activities:
            trigger_run = validate_activities(mavis)
            trigger_runs.extend(trigger_run)

        if not skip_dims:
            trigger_runs.extend(validate_all_dims(mavis))

            # This has a bug but I cannot figure it out
            # if not args.skip_missing_data:
            #     check_missing_data(mavis)

    tasks.update()

    # Trigger all the needed tasks
    from batch_jobs.data_management.run_transformations import run_transformations

    for tr in set(trigger_runs):
        run_transformations.send(company_slug=mavis.company.slug, task_id=tr)
