import json

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.v1.endpoints.narrative_content import _get_metrics
from core.logger import get_logger
from core.v4.analysisGenerator import _fetch_dataset, _get_row_from_filter
from core.v4.blocks.shared_ui_elements import (
    _basic_field_block,
    _clean_name,
    _create_content,
    _drop_down,
    _get_config,
    _get_dataset,
    _make_ui,
    _object,
)
from core.v4.dataset_comp.query.model import TabKindEnum
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import fill_in_template, get_required_fields

logger = get_logger()

TITLE = "Row"
DESCRIPTION = ""
VERSION = 1

HELPFUL_TIPS = "\n\n".join(
    [
        "Row is useful for pulling a certain value based on a filter",
        "<br>",
        "### Where are filter values coming from?",
        " - By default we will filter on any STRING value in a column if the number of unique values <10",
        " - Any variable that has the same value as a value in a column",
        # " - if 'Filter by Group Columns Only' is checked, we will check for variables for only group columns",
        "<br>",
        "### How do I get the value for the MAX or PERCENTILE of a Column?",
        " 1. Create an equation using the function `max(TABLE_COLUMN)` or `percentile(TABLE_COLUMN, 80)`",
        " 2. Come back here, and it will appear as a filter",
    ]
)


def get_schema(mavis: Mavis, internal_cache: dict):
    all_datasets = _get_dataset(mavis)
    # get all the groups
    all_groups = internal_cache["all_groups"] or []
    field_options = internal_cache["field_options"] or []
    group_columns = internal_cache["group_columns"] or []
    main_obj = _object(
        dict(
            dataset_slug=_drop_down(all_datasets, "slug", "name", title="Select Dataset"),
            group_slug=_drop_down(all_groups, "slug", "name", title="Select Group"),
            filter_options=_drop_down(field_options, "key", "label", title="Filters"),
        )
    )

    main_ui = dict(
        **_make_ui(
            order=[
                "dataset_slug",
                "group_slug",
                "filter_only_group",
                "agg_cols",
                "filter_options",
            ]
        ),
        dataset_slug=_make_ui(options=dict(update_schema=True, process_data=len(all_groups) > 0)),
        group_slug=_make_ui(options=dict(update_schema=True, process_data=len(group_columns) > 0)),
        filter_options=_make_ui(hidden=len(group_columns) == 0),
    )

    if len(field_options) == 0 and internal_cache["value"]["group_slug"]:
        override_content = _create_content("No Group Columns so press **RUN** to see the data", HELPFUL_TIPS)
    else:
        override_content = _create_content("You will see a preview here once you click `Run`", HELPFUL_TIPS)

    return _basic_field_block(
        main_obj,
        main_ui,
        override_content=override_content,
        fields=internal_cache["fields"],
        hide_format=True,
    )


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # get the groups
    # create the config
    config = data["left"]

    # get the value
    internal["value"] = config["value"]

    input_values = config["value"]

    # get the groups
    if input_values["dataset_slug"]:
        if input_values["group_slug"]:
            filters_obj = _get_metrics(
                mavis,
                input_values["dataset_slug"],
                input_values["group_slug"],
                data["_raw_fields"],
            )
            if len(filters_obj["metric_options"]) > 200:
                filters_obj = _get_metrics(
                    mavis,
                    input_values["dataset_slug"],
                    input_values["group_slug"],
                    data["_raw_fields"],
                    add_metrics=False,
                )

            # add the group columns
            internal["group_columns"] = filters_obj["group_cols"]
            internal["non_group_columns"] = filters_obj["non_group_columns"]

            # make the columns available
            internal["field_options"] = [
                dict(
                    key=json.dumps([_make_key(f) for f in c["filters"]]),
                    label=c["label"],
                )
                for c in filters_obj["metric_options"]
            ]

            # Add the first row
            internal["field_options"].insert(
                0,
                dict(
                    key=json.dumps([]),
                    label="First Row",
                ),
            )

            # add the query object
            d_obj = Dataset(mavis, obj=filters_obj["query_obj"])

        else:
            dataset_id = DatasetManager(mavis=mavis)._slug_to_id(config["value"]["dataset_slug"])
            d_obj = Dataset(mavis, dataset_id)

        # get all the groups
        internal["all_groups"] = [
            dict(slug=g.slug, name=g.label) for g in d_obj.model.all_tabs if g.kind == TabKindEnum.group
        ]

    if not internal["fields"]:
        internal["fields"] = data["_raw_fields"]
    return internal


def _make_key(f):
    return f"{f['column_id']}||{f['value']}"


def _open_key(s):
    pieces = s.split("||")
    col_id = pieces[0]
    value = "||".join(pieces[1:])
    return dict(column_id=col_id, value=utils.string_to_value(value))


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    # begin defining a new way of doing fields
    # there is no left if it is being loaded
    config, data = _get_config(data, "metric_variable")

    if update_field_slug in (None, "root_right_run"):
        config["name"] = name = _clean_name(config["name"] or "new metric", data["_raw_fields"])

        try:
            var = convert_to_fields(mavis, config, data["_raw_fields"])
        except Exception as e:
            logger.exception(e)
            var = None

        if var:
            lines = [
                "The dataset is filtered based on your condition and then you are getting all the columns in the dataset",
                f"`{name}` is now a dict with all the values",
                "```json",
                json.dumps(
                    var[name],
                    indent=4,
                ),
                "```",
                "<br>",
                "You also have access to every column in the data",
            ]

            # add the values
            lines.extend([f" - {k[1:]} : {v}" for k, v in var.items() if k.startswith("$")])

            # add the lines
            lines.append("**NOTE: if the columns are renamed, then you will need to update the references**")

            # add all the columns
            for k, v in var.items():
                if not k.startswith("#") and k != name:
                    lines.append(f" - {k} : {var[f'#{k}']} ({v})")

            preview = "\n\n".join(lines)
        else:
            preview = utils.bad_text("Failed to process the data")

        # TODO: change the tips to be based on the kind
        data["right"]["content"] = _create_content(preview, HELPFUL_TIPS)

        # get all the fields that this variable users
        if data["_raw_fields"]:
            config["field_depends_on"] = [
                r for r in list(set(get_required_fields(config))) if r in data["_raw_fields"].keys() and r != name
            ]

    elif update_field_slug == "root_left_value_dataset_slug":
        config["value"]["group_slug"] = None
        config["value"]["filter_options"] = None
    elif update_field_slug == "root_left_value_group_slug":
        config["value"]["filter_options"] = None

    # add the config back
    data["left"] = config
    return data


def run_data(mavis: Mavis, data: dict):
    data["left"]["other_names"] = [
        f'{data["left"]["name"]}_{c}' for c in data["left"]["value"]["column_mapping"].keys()
    ]
    return [dict(type="json", value=data["left"])]


def convert_to_fields(mavis: Mavis, config, fields, cache_minutes=None, local_cache=None, aeval=None):
    if config["name"] and config.get("value"):
        config = fill_in_template(config, fields, mavis=mavis, aeval=aeval)
        name = _clean_name(config["name"], fields)

        # better fetch of datasets
        d_obj = _fetch_dataset(mavis, local_cache or dict(_datasets={}), config["value"]["dataset_slug"])

        raw_data = d_obj.run(config["value"]["group_slug"])

        if config["value"].get("filter_options"):
            filter_options = config["value"].get("filter_options")
            # try loading filter options
            if isinstance(filter_options, str):
                try:
                    filter_options = json.loads(filter_options)
                except json.decoder.JSONDecodeError:
                    logger.exception(f"Could not load {filter_options}")
                    filter_options = []

            # get the data
            value = _get_row_from_filter(
                mavis,
                raw_data,
                [_open_key(f) for f in filter_options or []],
            )
        else:
            value = raw_data.row[0]

        fields = {
            f"{name}": value,
            f"#{name}": value,
            **{f"{name}_{k}": v for k, v in value.items()},
            **{f"#{name}_{k}": mavis.human_format(v, raw_data.column(k).context.format) for k, v in value.items()},
        }
        # _add_old_columns(config, fields, name, cm)

        return fields
    else:
        return {}


# def get_value_from_data(mavis: Mavis, cm, raw_data, option):
#     # simplify the input
#     cm = {c["id"]: c for c in cm}
#     rows = raw_data.rows

#     # make the rows better
#     if len(rows) == 0:
#         return {}
#     if len(option) == 0:
#         return rows[0]
#     else:
#         matches = []
#         sub_options = [
#             f for f in option if f["value"].split(".")[0] not in ("max", "min")
#         ]
#         for r in rows:
#             if len(sub_options) == 0 or all(
#                 r[cm[f["column_id"]]["label"]] == f["value"] for f in sub_options
#             ):
#                 matches.append(r)

#         # handld the other values
#         for f in option:
#             if f["value"].split(".")[0] in ("min", "max"):
#                 # simplify the column
#                 (func, metric_id) = f["value"].split(".")

#                 # get the max value
#                 max_val = utils.apply_function(
#                     func, [r[cm[metric_id]["label"]] for r in matches]
#                 )

#                 # find the group column for the max value
#                 val = next(
#                     r[cm[f["column_id"]]["label"]]
#                     for r in matches
#                     if r[cm[metric_id]["label"]] == max_val
#                 )

#                 # filter for that group's cols
#                 matches = [r for r in matches if r[cm[f["column_id"]]["label"]] == val]

#         # make sure we found a value
#         if len(matches) > 0:
#             return matches[0]

#     return {}
