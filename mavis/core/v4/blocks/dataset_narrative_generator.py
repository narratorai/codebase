import core.v4.query_mapping.config as qm_config
from core.api.customer_facing.datasets.utils import DatasetManager
from core.graph import graph_client
from core.utils import get_simple_type
from core.v4 import createDataset
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_ui,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Dataset Narrative Generator"
DESCRIPTION = "Generates a Narrative from a dataset"
VERSION = 1

ALL_AGG_FUNCTIONS = {
    af["name"]: af for af in qm_config.FUNCTIONS if af["kind"] == "agg_functions" and len(af["input_fields"]) <= 1
}


def get_schema(mavis: Mavis, internal_cache: dict):
    # load from cache
    all_datasets = [
        dict(slug=d.slug, name=d.name) for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
    ]

    kpi_columns = internal_cache.get("kpi_columns") or []
    kpi_column_default = internal_cache.get("kpi_column_default") or None
    feature_columns = internal_cache.get("feature_columns") or []
    feature_column_default = internal_cache.get("feature_column_default") or None
    time_to_convert_column = internal_cache.get("time_to_convert_column") or []
    time_to_convert_column_default = time_to_convert_column[0]["id"] if len(time_to_convert_column) > 0 else None

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            dataset_slug=_drop_down(all_datasets, "slug", "name", title="Dataset"),
            feature_column=_drop_down(
                feature_columns,
                "id",
                "label",
                default=feature_column_default,
                title="Choose a Feature/Attribute",
            ),
            kpi_column_func=_drop_down(list(ALL_AGG_FUNCTIONS.keys()), title="Agg Function"),
            kpi_column=_drop_down(
                kpi_columns,
                "id",
                "label",
                default=kpi_column_default,
                title="Choose a KPI",
            ),
            time_to_convert_column=_drop_down(
                time_to_convert_column,
                "id",
                "label",
                default=time_to_convert_column_default,
                title="Choose the Time to convert column",
            ),
            # this will map the data to the identifiers
            generate_inputs=_checkbox("Process Inputs"),
            copy_inputs=_input(),
            # all the user to replace the dataset parent
            new_dataset_slug=_input("New dataset Slug"),
        ),
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(
                flex_direction="row",
                flex_wrap="wrap",
            ),
            order=[
                "dataset_slug",
                "feature_column",
                "kpi_column_func",
                "kpi_column",
                "time_to_convert_column",
                "generate_inputs",
                "copy_inputs",
                "new_dataset_slug",
            ],
        ),
        dataset_slug=_make_ui(options=dict(size="large", update_schema=True, **_space(70))),
        feature_column=_make_ui(options=dict(**_space(40))),
        kpi_column_func=_make_ui(options=dict(**_space(20))),
        kpi_column=_make_ui(options=dict(**_space(30))),
        time_to_convert_column=_make_ui(options=dict(**_space(30))),
        # add the toggles
        generate_inputs=_make_ui(widget="BooleanButtonWidget", options=dict(process_data=True)),
        copy_inputs=_make_ui(widget="MarkdownRenderWidget"),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # process all the columns

    if data["dataset_slug"]:
        dataset_updator = DatasetManager(mavis=mavis)
        dataset_id = dataset_updator._slug_to_id(data["dataset_slug"])
        dataset_obj = dataset_updator.get_config(dataset_id)

        columns = dataset_obj["query"]["columns"]

        # TODO: make this way smarter
        internal["kpi_columns"] = columns
        internal["kpi_column_default"] = columns[0]
        internal["feature_columns"] = columns
        internal["feature_column_default"] = columns[1]
        internal["time_to_convert_column"] = [c for c in columns if get_simple_type(c["type"]) == "number"]
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    # get the dataset
    dataset_updator = DatasetManager(mavis=mavis)
    dataset_id = dataset_updator._slug_to_id(data["dataset_slug"])
    dataset_obj = dataset_updator.get_config(dataset_id)
    columns = {c["id"]: c for c in dataset_obj["query"]["columns"]}

    content = [
        "## Copy and paste the answer",
        "KPI metric Name: \n```\n{}\n```".format(
            createDataset._group_column_name(columns[data["kpi_column"]], data["kpi_column_func"])
        ),
        "Feature COLUMN ID : \n```\n{}\n```".format(data["feature_column"]),
        "Feature COLUMN Label : \n```\n{}\n```".format(columns[data["feature_column"]]["label"]),
        "Timestamp COLUMN ID : \n```\n{}\n```".format(
            next(c["id"] for c in dataset_obj["query"]["columns"] if c["name"] == "ts")
        ),
        "AGG FUNCTION : \n```\n{}\n```".format(data["kpi_column_func"]),
        "KPI COLUMN_ID : \n```\n{}\n```".format(data["kpi_column"]),
        "KPI  Column Label : \n```\n{}\n```".format(columns[data["kpi_column"]]["label"]),
    ]

    data["copy_inputs"] = "\n\n<br>\n\n".join(content)

    return data


def run_data(mavis: Mavis, data: dict):
    # fetch the data
    dataset_updator = DatasetManager(mavis=mavis)
    original_dataset_id = dataset_updator._slug_to_id(data["dataset_slug"])
    original_dataset_obj = dataset_updator.get_config(original_dataset_id)
    new_dataset_id = dataset_updator._slug_to_id(data["new_dataset_slug"])
    new_dataset_obj = dataset_updator.get_config(new_dataset_id)

    # copy over the old dataset parent to the new
    new_dataset_obj["query"]["activities"] = original_dataset_obj["query"]["activities"]
    new_dataset_obj["query"]["columns"] = original_dataset_obj["query"]["columns"] + [
        c for c in new_dataset_obj["query"]["columns"] if c["source_kind"] == "computed"
    ]

    # swap out the parent of the dataset
    dataset_updator.update_dataset_config(new_dataset_id, new_dataset_obj)

    return [dict(type="markdown", value="## DONE")]
