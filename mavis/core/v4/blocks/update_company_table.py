from batch_jobs.data_management.run_transformations import external_get_stream_addons
from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.errors import InvalidPermission, SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.util.mutex import create_mutex_key
from core.util.redis import redis_client
from core.v4.blocks.shared_ui_elements import _drop_down, _input, _make_ui, _object
from core.v4.mavis import Mavis

logger = get_logger()

TITLE = "Rename Activity Stream"
DESCRIPTION = "Rename an activity stream"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    # define the full schema
    schema = _object(
        dict(
            table=_drop_down(
                [t.activity_stream for t in mavis.company.tables],
                title="Current Tables",
            ),
            new_table_name=_input("Enter the New Table Name"),
        )
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(title=False, flex_direction="row", flex_wrap="wrap"),
            order=["table", "new_table_name"],
        )
    )
    return schema, schema_ui


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    return data


def rename_table(mavis: Mavis, t, nt, is_staging=False, is_identity=False, activity=None):
    # get the new table
    new_table = mavis.qm.stream_table(nt, is_staging=is_staging, is_identity=is_identity, activity=activity)

    # renamethe query
    mavis.run_query(
        mavis.qm.get_alter_table_query(
            mavis.qm.stream_table(t, is_staging=is_staging, is_identity=is_identity, activity=activity),
            new_table.table,
            add_ons=external_get_stream_addons(
                mavis.user, nt, is_identity=is_identity, manually_partitioned=activity is not None
            ),
        )
    )


def run_data(mavis: Mavis, data: dict):
    # define the add owns for the activity stream
    new_table_name = utils.slugify(data["new_table_name"])
    current_table = data["table"]
    activity_stream = mavis.company.table(current_table)
    content = []

    # Run the materializaiton
    from batch_jobs.data_management.run_transformations import run_transformations

    key = create_mutex_key(mavis.company.slug, run_transformations.fn, {}, False)
    can_run = redis_client.get(key).decode() == "0"

    batch_halt = graph_client.get_company(slug=mavis.company.slug).company[0].batch_halt

    if not batch_halt:
        raise SilenceError(
            "Please turn off all processing using the batch halt on the processing page",
            http_status_code=422,
        )

    if not can_run:
        raise InvalidPermission("Processing is running so we cannot rename the table")

    rename_table(mavis, current_table, new_table_name, is_identity=True)
    rename_table(mavis, current_table, new_table_name, is_staging=True)

    if activity_stream.manually_partition_activity:
        all_activites = graph_client.activity_index(company_id=mavis.company.id).all_activities

        for a in all_activites:
            rename_table(mavis, current_table, new_table_name, activity=a.slug)

    else:
        rename_table(mavis, current_table, new_table_name)

    content.append("Rename the table in the warehouse")

    # update the table
    updated_tables = graph_client.rename_company_table(
        company_id=mavis.company.id,
        activity_stream=data["table"],
        new_name=new_table_name,
    )

    content.append("### Updated Company Table")
    content.append("<br>")
    content.append("### Update the Transformations")

    # add the display of all the updates
    for t in updated_tables.update_transformation.returning:
        content.append(f" - {t.name}")

    content.append("<br>")

    #  Update all the datasets
    dataset = graph_client.dataset_index(company_id=mavis.company.id).dataset

    content.append("### Updated Datasets")
    dataset_updator = DatasetManager(mavis=mavis)
    for d in dataset:
        updated = False
        try:
            d_obj = dataset_updator.get_config(d.id)
            for a in d_obj["query"]["activities"]:
                if a["config"]["activity_stream"] == data["table"]:
                    a["config"]["activity_stream"] = new_table_name
                    updated = True

            if updated:
                dataset_updator.update_dataset_config(d.id, d_obj)
                content.append(f" - {d.name}")
        except Exception:
            logger.exception("Failed")

    return [dict(type="markdown", value="\n\n".join(content))]
