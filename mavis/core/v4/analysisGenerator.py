#
# !!! Security sensitive code !!!
#
# Modifying this file requires code review
#

# - this module seems broken, needs to have access to mavis.pivot_data
# - find_closest_longest_vec uses a `row` variable which does not exist there

import re
from collections import defaultdict
from copy import deepcopy
from graphlib import CycleError, TopologicalSorter
from math import copysign

import numpy as np
from pydantic import BaseModel
from spellchecker import SpellChecker

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.reports.utils import NarrativeManager
from core.constants import (
    ADVANCED_NARRATIVE_BLOCKS_V2,
    NARRATIVE_BLOCKS,
    NARRATIVE_BLOCKS_V2,
    SUPER_ADMIN_NARRATIVE_BLOCKS,
)
from core.errors import (
    AstevalError,
    FieldProcessingError,
    SilenceError,
    WrappedError,
)
from core.graph import graph_client
from core.logger import get_logger
from core.models.ids import get_uuid
from core.models.table import ColumnTypeEnum, TableData, format_to_old
from core.util.email import send_email
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.v4.block import Block
from core.v4.dataset_comp.query.migrations import v1_to_v2
from core.v4.dataset_comp.query.model import (
    AnyFilter,
    DatasetKindEnum,
    DetailKindEnum,
    NumberFilter,
    NumberOperatorEnum,
    StringArrayFilter,
    StringArrayOperatorEnum,
    StringFilter,
    StringOperatorEnum,
    TimeFilter,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import DatasetPlot, add_timeline
from core.v4.mavis import Mavis
from core.v4.narrative.constants import SUPPORTED_FUNC
from core.v4.narrative.helpers import (
    create_aeval,
    fill_in_template,
    get_required_fields,
)
from core.v4.narrativeTemplate import add_word
from core.v4.query_mapping.config import RESOLUTIONS

logger = get_logger()

# keep track of all the blocks we want to load
VALID_BLOCKS = NARRATIVE_BLOCKS + SUPER_ADMIN_NARRATIVE_BLOCKS + NARRATIVE_BLOCKS_V2 + ADVANCED_NARRATIVE_BLOCKS_V2

DATASET_KEYS = ["dataset_slug", "left_dataset_slug", "right_dataset_slug"]
UI_TABLE_RENDER = 1000
UI_MARKDOWN_TABLE_RENDER = 100

CHI_SQUARE = [3.84, 2.71, 2.3, 2.0, 1.32]  # 95%, 90%, 85%, 80%, 75% percent
MIN_POINTS = 5
OUTLIERS = 1

spell = SpellChecker()
spell.word_frequency.load_words(
    [
        "microsoft",
        "apple",
        "google",
        "facebook",
        "adwords",
        "misreport",
        "pinterest",
        "markdown",
        "emails",
    ]
)
SORTED_FUNC = sorted(SUPPORTED_FUNC, key=lambda a: len(a["label"]), reverse=True)


class ConsistentPeriod(BaseModel):
    percent: float = 0.0
    start_date: str | None
    end_date: str | None
    higher: str = ""
    lower: str = ""
    higher_avg: float = 0
    lower_avg: float = 0
    current: bool = False
    avg_to_now: float = 0


class Line(BaseModel):
    y_intercept: float = 0
    slope: float = 0
    first_y: float = 0
    final_y: float = 0
    avg_residual: float = 0
    y_projections: list[float] = None
    x_projections: list[str] = None
    final_x: str | None
    first_x: str | None
    start_date: str | None
    end_date: str | None


class Trend(Line):
    all_lines: list[Line] = []
    last_slope: float | None
    last_start_date: str | None
    last_final_y: float | None


def _display(value):
    if isinstance(value, dict):
        vals = []
        for k, v in value.items():
            vals.append(f"\n - {k}: {v}")
        return "".join(vals)
    else:
        return value


@tracer.start_as_current_span("fields_to_autocomplete")
def fields_to_autocomplete(mavis: Mavis, fields, include_pretty=False):
    autocomplete = dict(
        onlyCompleteBetween=["{", "}"],
        triggerCharacters=["{", " "],
        completionItems=[
            dict(
                label=f,
                insertText=f,
                documentation=dict(
                    value="\n\n".join(
                        [
                            "## {f}",
                            "**#{f}:** {pretty_val}",
                            "**{f}:{raw_val}",
                            "*Note: {explain}*",
                        ]
                    ).format(
                        title=utils.title(f.lstrip("#")),
                        f=f,
                        explain=fields.get("__" + f.lstrip("#")) or "",
                        raw_val=str(fields.get(f.lstrip("#"))),
                        pretty_val=_display(fields.get("#" + f.lstrip("#"))),
                    ),
                ),
            )
            for f, value in fields.items()
            if ("#" not in f or include_pretty) and not f.startswith("__")
        ]
        # Only show functions that are not deprecated and not superadmin
        + [
            s
            for s in SUPPORTED_FUNC
            if not s.get("deprecated") and (mavis.user.is_internal_admin or not s.get("superadmin_only"))
        ],
    )
    return autocomplete


def _get_default_fields(mavis: Mavis):
    default_field_configs = []

    for key, val, format_name in [
        ("company_slug", mavis.company.slug, "text"),
        ("cache_minutes", mavis.company.cache_minutes, "text"),
        ("warehouse", mavis.company.warehouse_language, "text"),
        ("company_name", mavis.company.name, "text"),
        ("website", mavis.company.website, "text"),
        ("local_tz", mavis.company.timezone, "text"),
        ("logo_url", mavis.company.logo_url, "text"),
        ("current_user_email", mavis.user.email, "text"),
        ("start_data_on", mavis.company.start_data_on, "date_short"),
    ]:
        if val:
            default_field_configs.append(dict(name=key, format=format_name, kind="value", value=dict(content=val)))

    # define the variables for all the referenced time
    now = utils.localnow(mavis.company.timezone)

    # add all the blurbs
    default_field_configs.extend(
        [
            dict(
                name="now",
                format="time",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "hour")),
            ),
            # get today
            dict(
                name="today",
                format="date_short",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "day")),
            ),
            # get today
            dict(
                name="this_day",
                format="date_short",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "day")),
            ),
            dict(
                name="this_week",
                format="week",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "week")),
            ),
            dict(
                name="this_month",
                format="month",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "month")),
            ),
            dict(
                name="this_quarter",
                format="quarter",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "quarter")),
            ),
            dict(
                name="this_year",
                format="year",
                kind="value",
                value=dict(content=mavis.date_trunc(now, "year")),
            ),
            # get yesterday
            dict(
                name="yesterday",
                format="date_short",
                kind="value",
                value=dict(mavis=utils.date_add(mavis.date_trunc(now, "day"), "day", -1)),
            ),
            dict(
                name="last_day",
                format="date_short",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "day"), "day", -1)),
            ),
            dict(
                name="last_week",
                format="week",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "week"), "week", -1)),
            ),
            dict(
                name="last_month",
                format="month",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "month"), "month", -1)),
            ),
            dict(
                name="last_quarter",
                format="quarter",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "quarter"), "quarter", -1)),
            ),
            dict(
                name="last_year",
                format="year",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "year"), "year", -1)),
            ),
            # get yesterday
            dict(
                name="two_days_ago",
                format="date_short",
                kind="value",
                value=dict(content=utils.date_add(mavis.date_trunc(now, "day"), "day", -2)),
            ),
            dict(
                name="two_week_ago",
                format="week",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "week"), "week", -2)),
            ),
            dict(
                name="two_month_ago",
                format="month",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "month"), "month", -2)),
            ),
            dict(
                name="two_quarter_ago",
                format="quarter",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "quarter"), "quarter", -2)),
            ),
            dict(
                name="two_year_ago",
                format="year",
                kind="value",
                value=dict(content=mavis.date_add(mavis.date_trunc(now, "year"), "year", -2)),
            ),
            dict(
                name="last_point_disclaimer",
                format="text",
                kind="value",
                value=dict(
                    content="Please be aware that the last data point in the time series plots can still change because the data is still updating for the most recent time frame."
                ),
            ),
        ]
    )

    return default_field_configs


@tracer.start_as_current_span("_create_fields")
def _create_fields(
    mavis,
    field_configs,
    narrative=None,
    cache_minutes=None,
    fields=None,
    local_cache=None,
    field_overrides=None,
):
    updated = []
    local_cache = _get_cache(local_cache, cache_minutes)

    default_field_configs = []
    if not fields:
        default_field_configs = _get_default_fields(mavis)
        updated.extend([f["name"] for f in default_field_configs])
        fields = dict(_default_fields=[u for u in updated])

    # keep track of the starting fields
    if field_overrides:
        for k, v in field_overrides.items():
            # add all the variation
            add_field_to_object(
                mavis,
                fields,
                updated,
                k,
                v,
                {"format": utils.guess_format(v, utils.get_type(v))},
            )

    # update the default fields to support overrides
    default_field_configs = [f for f in default_field_configs if f["name"] not in [f["name"] for f in field_configs]]

    # reset the value
    for f in field_configs:
        if f.get("block") == "table_variable":
            block = Block(mavis, f.get("block"), ignore_track=True)
            # should add the fields
            block.run_data(dict(left=f, _local_cache=local_cache))

    # get all the dependencies
    (field_as_dict, _) = get_dependencies(mavis, default_field_configs + field_configs, narrative, local_cache)

    # order the items based on the right order
    item_dict = {f["name"]: f for f in (default_field_configs + field_configs)}

    try:
        ordered_dependencies = list(
            TopologicalSorter({k: v for k, v in field_as_dict.items() if not k.startswith("g.") or v}).static_order()
        )
    except CycleError as e:
        ignore_keys = e.args[1]
        for r in ignore_keys:
            fields[r] = "COULD NOT COMPUTE DUE TO RECURSIVE DEPENDENCY"
        ordered_dependencies = list(
            TopologicalSorter(
                {k: v for k, v in field_as_dict.items() if k not in ignore_keys and (not k.startswith("g.") or v)}
            ).static_order()
        )

    # We can process the activities because we are constatnly getting the activitie s
    (fields, temp_updated) = compile_fields(
        mavis,
        default_field_configs
        + [item_dict[o] for o in ordered_dependencies if not o.startswith("g.") and item_dict.get(o)],
        cache_minutes=cache_minutes,
        fields=fields,
        local_cache=local_cache,
    )
    updated.extend(temp_updated)
    # return the ordered configs
    orded_configs = [
        item_dict[o]
        for o in ordered_dependencies
        if not o.startswith("g.")
        and item_dict.get(o)
        and item_dict[o]["name"] not in [f["name"] for f in default_field_configs]
    ]
    return fields, updated, orded_configs


def get_dependencies(mavis, field_configs, narrative, local_cache):
    # initialize the dependencies
    names = {}
    field_as_dict = defaultdict(list)

    for f in field_configs:
        names[f["name"]] = f["name"]

        for other_name in f.get("other_names") or []:
            field_as_dict[other_name].append(f["name"])
            names[other_name] = f["name"]

    group_name_mapping = {}

    dataset_narrative_objs = utils.recursive_find(narrative, DATASET_KEYS, True)

    # recompute all the fields
    for f in field_configs + [v for _, v in dataset_narrative_objs]:
        if f.get("value") and f.get("name"):
            f["field_depends_on"] = [r for r in f.get("field_depends_on") or [] if r in names.keys() and r != f["name"]]
            field_as_dict[f["name"]].extend(f["field_depends_on"])
            value = f["value"]
        else:
            f["field_depends_on"] = []
            value = f

        # loop through both dataset_slug and left_dataset_slug because both are used
        for key in DATASET_KEYS:
            if isinstance(value, dict) and key in value.keys():
                d_group_key = "g.{}.{}".format(value[key], str(value.get(key.replace("dataset", "group"))))

                parent_key = f"g.{value[key]}.None"

                # add the dataset
                if d_group_key not in field_as_dict.keys():
                    d_object = _fetch_dataset(mavis, local_cache, value[key])

                    # save the group name mapping
                    group_name_mapping[parent_key] = dict(label="Parent", slug=value[key], group_slug=None)

                    # handle the prefilter fields
                    prefilter_fields = list(set(get_required_fields(d_object.obj["query"]["activities"], names)))

                    # get all the dependencies for the parent
                    field_as_dict[parent_key].extend(
                        list(set(get_required_fields(d_object.obj["query"]["columns"], names) + prefilter_fields))
                    )

                    # add all the group dependencies
                    for g in d_object.obj["query"]["all_groups"]:
                        t_g_key = "g.{}.{}".format(value[key], str(g["slug"]))

                        # update the name
                        group_name_mapping[t_g_key] = dict(
                            label=g["name"],
                            slug=value[key],
                            group_slug=g["slug"],
                        )

                        all_dependent_group_columns = d_object.ds._get_all_column_ids(g)

                        # add the columns into a hidden field so when I go get_required_fields it all works out
                        g["dependent_groups"] = [
                            c
                            for c in d_object.obj["query"]["columns"]
                            if c["id"] in all_dependent_group_columns or c["filters"]
                        ]

                        field_as_dict[t_g_key].extend(
                            list(
                                set(
                                    get_required_fields(
                                        {k: v for k, v in g.items() if k != "plots"},
                                        names,
                                    )
                                )
                            )
                        )
                        # Add parent depnedencies if preefilters
                        if prefilter_fields:
                            field_as_dict[t_g_key].extend(parent_key)

                # don't add the dependencies unelss the group has a dependency
                if field_as_dict.get(d_group_key):
                    f["field_depends_on"].append(d_group_key)

        if f.get("name"):
            field_as_dict[f["name"]].extend([names.get(dp) or dp for dp in set(f["field_depends_on"])])
    return field_as_dict, group_name_mapping


def replace_field_variable(text, old_field=None, new_field=None):
    # if the field has text
    text = re.sub(rf"\b{old_field}\b", new_field, text)
    return text


def find_missing_fields(narrative, fields):
    # find the missing fields
    missing_fields = [f for f in get_required_fields(narrative) if f not in fields.keys()]
    add_missing_fields = {f: f"!{f}:MISSING!" for f in missing_fields}
    return add_missing_fields


def add_field_to_object(mavis: Mavis, fields, updated, variable, value, obj):
    """
    Deals with adding_fields_to_objects
    """

    # add a pretty way to show the value
    current_format = obj.get("format") if obj.get("format") not in (None, "auto") else utils.guess_format(variable)

    # add the variable and the human format variable
    fields[variable] = value
    updated.append(variable)

    # deal with the consistency checker
    if isinstance(value, dict) and "higher_avg" in value.keys():
        pretty_val = dict(
            percent=mavis.human_format(value["percent"], "percent"),
            start_date=mavis.human_format(value["start_date"], "date_short"),
            end_date=mavis.human_format(value["end_date"], "date_short"),
            higher=mavis.human_format(value["higher"], "text"),
            lower=mavis.human_format(value["lower"], "text"),
            higher_avg=mavis.human_format(value["higher_avg"], current_format),
            lower_avg=mavis.human_format(value["lower_avg"], current_format),
            avg_to_now=mavis.human_format(value["avg_to_now"], current_format),
            current="is consistent" if value["current"] else "is not consistent",
        )
    # deal with trend finder
    elif isinstance(value, dict) and "final_y" in value.keys():
        pretty_val = dict(
            final_x=mavis.human_format(value["final_x"], "date_short"),
            final_y=mavis.human_format(value["final_y"], current_format),
            last_final_y=mavis.human_format(value["last_final_y"], current_format),
            start_date=mavis.human_format(value["start_date"], "date_short"),
            last_start_date=mavis.human_format(value["last_start_date"], "date_short"),
            end_date=mavis.human_format(value["end_date"], "date_short"),
            slope=mavis.human_format(value["slope"], current_format),
            y_intercept=mavis.human_format(value["y_intercept"], "number"),
            y_projections=[mavis.human_format(ty, current_format) for ty in (value["y_projections"] or [])],
            x_projections=[mavis.human_format(ty, "date") for ty in (value["x_projections"] or [])],
            last_slope=mavis.human_format(value["last_slope"], current_format),
        )

    # deal with trend finder
    elif isinstance(value, dict) and "groups" in value.keys():
        pretty_val = dict(
            kind=value.get("kind"),
            groups=value["groups"],
            group_names=value["group_names"],
            metrics=[mavis.human_format(v, current_format) for v in value["metrics"]],
            percents=[mavis.human_format(v, "percent") for v in value["percents"]],
            else_percent=mavis.human_format(value["else_percent"], "percent"),
            else_metric=mavis.human_format(value["else_metric"], current_format),
            else_name=value["else_name"],
            confidence_interval=mavis.human_format(value["confidence_interval"], "percent"),
            stat_significant=(
                "is statistically significant" if value["stat_significant"] else "is not statistically significant"
            ),
            error=value.get("error"),
        )
    else:
        pretty_val = mavis.human_format(value, current_format)

    fields["#" + variable] = pretty_val
    fields["__" + variable] = "{}\n\n*depends_on:* {}\n".format(
        obj.get("explanation") or "No explanation",
        ", ".join([r for r in obj.get("field_depends_on") or [] if r in fields.keys()]),
    )
    updated.append("#" + variable)
    updated.append("__" + variable)


def _get_cache(local_cache, cache_minutes):
    if local_cache:
        return local_cache
    else:
        return dict(_datasets=dict(), cache_minutes=cache_minutes)


def _fetch_dataset(mavis, local_cache, slug: str) -> Dataset:
    d_obj = local_cache["_datasets"].get(slug)
    if d_obj is None:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(slug)
        d_obj = local_cache["_datasets"][slug] = Dataset(
            mavis, dataset_id, within_minutes=local_cache.get("cache_minutes")
        )
        if not d_obj.obj.get("fields"):
            d_obj.obj["_needs_fields"] = True

    # handle adding the fields
    if local_cache.get("_fields"):
        d_obj.obj["fields"] = {
            k: v
            for k, v in local_cache["_fields"].items()
            if not (
                (isinstance(v, dict) and v.get("rows")) or isinstance(v, list) or utils.is_error(v) or k.startswith("_")
            )
        }

    return d_obj


def preview_value(mavis, configs, raw_fields):
    templates = []
    updates = []

    fields = deepcopy(raw_fields)
    # process all the updates
    for config in configs:
        # reder a preview
        val_result = get_value_from_field_config(mavis, config, fields, cache_minutes=True)
        add_field_to_object(
            mavis,
            fields,
            updates,
            config["name"],
            val_result,
            dict(format=config["format"]),
        )

        # create a rendering of the data
        templates.append("# {}".format(utils.title(config["name"])))

    # add all the fields that will be updated
    for u in updates:
        if not u.startswith("#") and not u.startswith("__"):
            templates.append(
                "\n\n".join(
                    [
                        f"# {utils.title(u)}",
                        "## Exact",
                        ("{{{n}}}" if not isinstance(fields[u], dict) else "**This is a table**"),
                        "<br>",
                        "## Pretty",
                        "{{#{n}}}",
                        "<br>",
                        "_this is using the oldest cache value for performance_",
                    ]
                ).format(n=u)
            )

    # after all the configs
    preview_text = fill_in_template("\n<br>\n\n".join(templates), fields, mavis=mavis)

    return preview_text


@tracer.start_as_current_span("get_value_from_field_config")
def get_value_from_field_config(mavis, f, fields, cache_minutes=None, local_cache=None, aeval=None):
    set_current_span_attributes(field_config=str(f))

    # fixed the local cache
    local_cache = _get_cache(local_cache, cache_minutes)

    f["format"] = fill_in_template(f.get("format"), fields, aeval=aeval, mavis=mavis)
    obj = fill_in_template(f["value"], fields, aeval=aeval, mavis=mavis)

    # input metric
    if f["kind"] in ("value", "computed", "value_field"):
        value = _get_value_field_config(mavis, obj)

    elif f["kind"] == "placeholder":
        value = utils.string_to_value(obj["example_value"])

    # labeled fieldl
    elif f["kind"] in "labeled_field":
        value = _get_label_field_field_config(mavis, obj, fields)

    elif f["kind"] == "consistency_checker":
        value = _get_value_from_consisency_checker(mavis, obj, local_cache)

    elif f["kind"] == "dataset_metric":
        value = _get_dataset_metric_from_config(mavis, obj, local_cache)

    elif f["kind"] == "table_metric":
        value = _get_table_metric_from_confg(mavis, obj)

    elif f["kind"] == "trend":
        value = _get_trend_from_config(mavis, obj, local_cache)

    elif f["kind"] == "bucket":
        value = _get_bucket_from_config(mavis, obj, local_cache, f["format"])

    return value


def _get_xs(dataset: Dataset, kind, group_slug):
    raw_data = dataset.run(group_slug)
    cols = dataset.model.tab(group_slug).get_columns(DetailKindEnum.group, output=True)
    if kind == "over_time":
        xs = [c.id for c in cols if c.type == ColumnTypeEnum.timestamp]
    elif kind == "all":
        xs = [c.id for c in cols]
    else:
        xs = [cols[0].id]

    xs = [raw_data.column(x).field for x in xs]
    x_col = []
    for row in raw_data.rows:
        x_col.append("-".join([str(row[v] if row[v] is not None else "NULL") for v in xs]))

    return (x_col, ColumnTypeEnum.string if len(xs) > 1 else raw_data.column(field=xs[0]).type, xs[0])


def _get_bucket_from_config(mavis, obj, local_cache, format_kind):
    # grab the traces
    dataset = _fetch_dataset(mavis, local_cache, obj["dataset_slug"])
    (xs, x_type, first_x) = _get_xs(dataset, "all", obj["group_slug"])

    raw_data = dataset.run(obj["group_slug"])
    trace_data = dict(x=xs, y=raw_data.column_values(raw_data.column(obj["metric_id"])))
    if col := raw_data.column(obj["count_id"]):
        size_data = dict(x=xs, y=raw_data.column_values(col))
    else:
        size_data = None

    if col := raw_data.column(obj["std_id"]):
        std_data = dict(x=xs, y=raw_data.column_values(col))
    else:
        std_data = None

    if trace_data is None:
        raise FieldProcessingError("No rows found in the data so cannot create buckets")

    if std_data is None and any(y > 1 for y in trace_data["y"]):
        raise FieldProcessingError("You have a non-conversion metric without a STD")

    # update the traces
    value = _find_buckets(
        mavis,
        trace_data,
        size_data,
        x_type,
        number_of_buckets=obj["number_of_buckets"],
        version=obj.get("version"),
        std_data=std_data if format_kind != "percent" else None,
        is_decrease=obj.get("direction", "increase").lower() == "decrease",
        format_kind=format_to_old(first_x.context.format),
        column_name=first_x.header_name,
    )

    # handle saving another else name
    if not value.get("else_name"):
        if len(value["groups"]) <= 3:
            temp_name = "/".join([str(each_g) for each_g in value["groups"]])

            if temp_name.strip().lower().startswith("not "):
                value["else_name"] = temp_name[4:]

            # make sure it is `not no` - and instead use `has`
            elif temp_name.strip().lower().startswith("no "):
                value["else_name"] = "has" + temp_name[3:]

            else:
                value["else_name"] = f"Not {temp_name}"
        else:
            value["else_name"] = "Other"

    return value


def _get_trend_from_config(mavis, obj, local_cache):
    dataset = _fetch_dataset(mavis, local_cache, obj["dataset_slug"])
    (xs, _, _) = _get_xs(dataset, "over_time", obj["group_slug"])

    raw_data = dataset.run(obj["group_slug"])
    # get the traces
    trace_data = dict(x=xs, y=raw_data.column_values(raw_data.column(obj["metric_id"])))
    if col := raw_data.column(obj["count_id"]):
        error_trace = dict(x=xs, y=raw_data.column_values(col))
    else:
        error_trace = None

    # update the traces
    value = _find_trend(
        mavis,
        trace_data,
        error_trace=error_trace,
        max_avg_residual_percent_increase=obj["threshold"],
        min_points=obj["min_points"],
    )
    return value


def _get_value_from_consisency_checker(mavis, obj, local_cache):
    dataset = _fetch_dataset(mavis, local_cache, obj["dataset_slug"])
    raw_data = dataset.run(obj["group_slug"])

    cols = dataset.model.tab(obj["group_slug"]).output_columns

    x_col = [c for c in raw_data.columns if c.type == ColumnTypeEnum.timestamp][0]
    group_cols = [raw_data.column(c["id"]) for c in cols if c.id != x_col.id and c.details.kind == DetailKindEnum.group]

    # cast the comparison to a string
    obj["compare_a"] = str(obj["compare_a"])
    obj["to_b"] = str(obj["to_b"])

    xs = []
    metric_col = raw_data.column(obj["metric_id"])
    count_col = raw_data.column(obj["count_id"])
    trace_data = {
        str(obj["compare_a"]): dict(data=dict(x=xs, y=[]), count=dict(x=xs, y=[])),
        str(obj["to_b"]): dict(data=dict(x=xs, y=[]), count=dict(x=xs, y=[])),
    }
    for r in raw_data.rows:
        if r[x_col.field] not in xs:
            for v in trace_data.values():
                for kk in ("data", "count"):
                    if len(v[kk]["x"]) != len(v[kk]["y"]):
                        v[kk]["y"].append(0)

            xs.append(r[x_col.field])

        group_val = "-".join([str(r[c]) for c in group_cols])
        if dat := trace_data.get(group_val):
            dat["data"]["y"].append(r[metric_col.field])
            if count_col:
                dat["count"]["y"].append(r[count_col.field])

    # Null the counts
    if not count_col:
        for _, v in trace_data.items():
            v["count"] = None

    # update the traces
    value = _check_consistency(
        mavis,
        trace_data,
        min_percent=obj["threshold"],
        min_points=obj["min_points"],
        keys=(obj["compare_a"], obj["to_b"]),
        min_date=obj.get("min_date"),
    )
    return value


def _get_value_field_config(mavis, obj):
    return obj.get("content") if isinstance(obj, dict) else obj


def _get_label_field_field_config(mavis, obj, fields):
    for op in obj["conditions"]:
        if op["condition"]:
            return op["text"]
    else:
        return obj["else_value"] or None


def _get_dataset_metric_from_config(mavis, obj, local_cache):
    # get the data
    res = _fetch_dataset(mavis, local_cache, obj["dataset_slug"]).run(
        obj.get("group_slug"),
    )
    # look up the values
    return lookup_value(res, obj)


def _get_table_metric_from_confg(mavis, obj):
    return lookup_value(obj["table"], {c["id"]: c["id"] for c in obj["columns"]}, obj)


def lookup_value(table_data: TableData, config_object):
    value = None
    values = []

    # if no column exists return the full object
    if config_object.get("column_id") is None:
        return table_data

    # find the match for the metric
    for r in table_data.rows:
        # !!!! IMPORATNT!!!!!
        # This is looking to see where the lookup FAILS so then it is not valid
        for lookup in config_object.get("lookups") or []:
            # get the condition
            (condition, look_up_value) = __map_value(lookup)

            actual_value = utils.string_to_value(r[table_data.column(lookup["lookup_column_id"]).field])

            # Because this is a break we will check for the opposite value
            if condition == ">=":
                if actual_value < look_up_value:
                    break

            elif condition == "<=":
                if actual_value > look_up_value:
                    break

            elif condition == "is_null":
                if actual_value is not None:
                    break

            elif condition == "is_not_null":
                if actual_value is None:
                    break

            elif condition == "==":
                # in case there is a stupid rounding issue on warehouse, I grab the values
                if actual_value != look_up_value:
                    break

            elif condition == "!=":
                if not (actual_value != look_up_value):
                    break

        else:
            if config_object.get("function"):
                values.append(r[table_data.column(config_object["column_id"]).field])
            else:
                # it found the value where the requirements are met
                value = r[table_data.column(config_object["column_id"]).field]
                break

    # process the function
    if config_object.get("function"):
        value = utils.apply_function(config_object.get("function"), values)

    return value


def __map_value(lookup):
    # get the new setup form the old
    if lookup.get("condition"):
        return lookup["condition"], lookup.get("value")

    if lookup.get("min_lookup_value") is not None:
        return ">=", lookup.get("min_lookup_value")

    elif lookup.get("max_lookup_value") is not None:
        return "<=", lookup.get("max_lookup_value")

    elif lookup.get("lookup_column_value") is not None:
        return "==", lookup["lookup_column_value"]

    else:
        return "is_null", None


def _get_all_names(f):
    return [f["name"], "#" + f["name"], "__" + f["name"]] + f.get("other_names", [])


@tracer.start_as_current_span("compile_fields")
def compile_fields(
    mavis: Mavis,
    field_configs,
    cache_minutes=None,
    fields=None,
    local_cache: dict = None,
):
    """
    Compiles the fields object from the config
    """

    updated = []
    if fields is None:
        fields = {}

    aeval = create_aeval(fields)
    local_cache = _get_cache(local_cache, cache_minutes)

    # Because equations can depend on metric or on values then we need to compile the data in order
    for f in field_configs:
        # don't bother processing the data fi it already exists
        if f["name"] in fields.keys():
            if ("#" + f["name"]) not in fields.keys():
                fields["#" + f["name"]] = mavis.human_format(fields[f["name"]], f["format"])
            continue

        if f.get("version") == "v2":
            # get the block
            block = Block(mavis, f.get("block"), ignore_track=True)
            try:
                # let the block decide how it wants to be processed
                value = block.module.convert_to_fields(
                    mavis,
                    f,
                    fields,
                    cache_minutes=cache_minutes,
                    local_cache=local_cache,
                    aeval=aeval,
                )

                if value:
                    fields.update(**value)
                    updated.extend(_get_all_names(f))

            except Exception as e:
                value = {f["name"]: f"FAILED: ({utils.get_error_message(e)})"}

            for k, v in value.items():
                if not k.startswith("__"):
                    aeval.symtable[k.replace("#", "pretty")] = v

        else:
            # save the format because it might be replaced
            original_format = f.get("format")

            # get the value form config
            try:
                value = get_value_from_field_config(
                    mavis,
                    f,
                    fields,
                    cache_minutes=cache_minutes,
                    local_cache=local_cache,
                    aeval=aeval,
                )
            except Exception as e:
                value = f"FAILED: ({utils.get_error_message(e)})"
                f["format"] = None

            # add the value chosen to the fields
            add_field_to_object(mavis, fields, updated, f["name"], value, f)

            # add the compiled fields to the data
            aeval.symtable[f["name"]] = fields[f["name"]]
            aeval.symtable["pretty" + f["name"]] = fields["#" + f["name"]]

            # reset the format
            f["format"] = original_format

            # kepe the loop up to date
            local_cache["_fields"] = fields

    return fields, updated


def update_datasets_with_fields(mavis, nar, fields=None):
    if not fields:
        fields = _create_fields(
            mavis,
            nar["field_configs"],
            narrative=nar["narrative"],
            cache_minutes=10000000,
        )
        fields = fields[0]

    # find all dataset slugs
    dataset_updator = DatasetManager(mavis=mavis)
    dataset_keys = utils.recursive_find(nar, DATASET_KEYS, False)
    for d_slug in list(set(dataset_keys)):
        d_id = dataset_updator._slug_to_id(d_slug)
        d_obj = Dataset(mavis, d_id)
        # add and upload the fields
        d_obj.obj["fields"] = {
            k: v
            for k, v in fields.items()
            if not (
                (isinstance(v, dict) and v.get("rows")) or isinstance(v, list) or utils.is_error(v) or k.startswith("_")
            )
        }
        d_obj.update()


def __get_df_obj(mavis, dataset: Dataset, df, is_override=False, is_not=False, replace_filt: list[AnyFilter] = None):
    logger.debug("Getting the filter object", df=df)
    d_obj = dataset.model
    replace_filt = replace_filt or []

    if df["group_slug"] == "_parent":
        col = d_obj.column(df["column_id"])

        if col is None:
            raise SilenceError(f"Could not find {df['name']}'s column in dataset")

        if is_override and col.filters is not None:
            col.filters = None

        for filt in replace_filt:
            col.add_filter(filt, is_not)

        return col

    elif df["group_slug"].startswith("_edit"):
        activity = d_obj.activity(df["group_slug"].split(".")[-1])
        if activity is None:
            raise SilenceError(f"Could not find {df['name']}'s Activity does not exist in dataset")

        if is_override and activity.prefilter_columns:
            activity.prefilter_columns = []

            col = v1_to_v2(mavis, dataset.ds, dict(query=dataset.obj["query"])).parse_prefilter_column(
                df["activity_column"]
            )
            for filt in replace_filt:
                col.add_filter(filt, is_not)

            activity.prefilter_columns.append(col)

        return activity

    # handle adding the filter
    elif df["group_slug"].startswith("_prefilter"):
        group = d_obj.tab(df["group_slug"].split(".")[-1])
        if group is None:
            raise SilenceError(f"Could not find {df['name']}'s Group does not exist in dataset")

        if is_override and group.parent_filters:
            group.remove_parent_filter_column(df["column_id"])

        group.add_parent_filter(df["column_id"], replace_filt, is_not)
        return group

    else:
        if df["group_slug"]:
            col = d_obj.tab(df["group_slug"].split(".")[-1]).column(df["column_id"])
        else:
            col = d_obj.column(df["column_id"])

        if col is None:
            raise SilenceError(f"Could not find {df['name']}'s column in dataset")

        if is_override and col.filters is not None:
            col.filters = None

        col.add_filter(replace_filt, is_not)

        return col


def __get_mapping(temp_id, value, c_res):
    from_res_to_id = utils.order_all_words(
        add_word(c_res.lower(), temp_id, False) + add_word(f"{c_res[0]}o{c_res[0]}", temp_id, False)
    )

    from_id_to_new_res = utils.order_all_words(
        add_word(value, temp_id, False, False) + add_word(f"{value[0]}o{value[0]}", temp_id, False, False)
    )

    return from_res_to_id + from_id_to_new_res


def __apply_time_resolution_swap_to_narrative(mavis, nar, df, value):
    for s in nar["sections"]:
        if s["id"] != df.get("section_id"):
            continue

        for c in s["content"]:
            if c["id"] != df.get("content_id"):
                continue

            temp_id = get_uuid()

            # if markdown then replace the text
            if c["type"] == "markdown":
                ces = df.get("current_value", "month")
                mapping = __get_mapping(temp_id, value, ces)
                c["text"] = utils.replace_str(c["text"], mapping)

            # if it is a metric column then recursive apply
            elif c["type"] == "metric_v2":
                update_all = []
                for f in c["data"].get("filters", []) + c["data"].get("compare_filters", []):
                    update_all.append((f, "value"))

                update_all.append((c, "filter_label"))
                update_all.append((c, "compare_filter_label"))

                ces = df.get("current_value", "month")
                mapping = __get_mapping(temp_id, value, ces)

                for obj, k in update_all:
                    if obj.get(k):
                        obj[k] = utils.replace_str(obj[k], mapping)

            else:
                continue

    return False


def __apply_time_resolution_swap(mavis, df, local_cache, value):
    # get the object
    dataset = _fetch_dataset(mavis, local_cache, df["dataset_slug"])
    current_column = __get_df_obj(mavis, dataset, df)

    # get the resolution
    c_res = df.get("current_value", "month")
    # If they ar different
    if c_res and c_res.lower() != value:
        temp_id = get_uuid()
        mapping = __get_mapping(temp_id, value, c_res)
        # if computed then swap it
        if current_column.details.kind == DetailKindEnum.computed:
            current_column.details.raw_string = utils.replace_str(current_column.details.raw_string, mapping)
        elif dataset.model.kind == DatasetKindEnum.time:
            dataset.model.cohort_time.resolution = value

        current_column.label = utils.replace_str(current_column.label, mapping)
        return True
    else:
        return False


def _dynamic_filter_to_model(mavis, df, local_cache, value) -> list[AnyFilter]:
    # handle NULL values
    if value == "NULL":
        value = None
    # replace the list
    elif isinstance(value, list):
        value = [v if v != "NULL" else None for v in value]

    col_filt = []
    # apply the column filter
    if df["kind"] == "list":
        col_filt.append(StringFilter(operator=StringOperatorEnum.equal, value=value))
    elif df["kind"] == "multi_select":
        if not isinstance(value, list):
            value = [value]
        # compute the values
        col_filt.append(StringArrayFilter(operator=StringArrayOperatorEnum.is_in, values=value))

    else:
        (value_type, _) = __get_dynamic_filter_values(mavis, df, local_cache)

        if value_type == "time_range" and isinstance(value, dict) and value.get("operator"):
            print(value)
            col_filt.append(TimeFilter(**value))

        elif value_type == "number_range":
            if value["from"]:
                col_filt.append(
                    NumberFilter(
                        operator=NumberOperatorEnum.greater_than_equal,
                        number=value["from"],
                    )
                )

            if value["to"]:
                col_filt.append(
                    NumberFilter(
                        operator=NumberOperatorEnum.less_than,
                        number=value["to"],
                    )
                )

        elif isinstance(value, str):
            if df["type"] == "current_user_email" or df["kind"] in (
                "list",
                "list_w_default",
                "multi_select",
            ):
                if isinstance(value, list):
                    col_filt.append(StringArrayFilter(operator=StringArrayOperatorEnum.is_in, values=value))
                else:
                    col_filt.append(StringFilter(operator=StringOperatorEnum.equal, value=value))
            else:
                col_filt.append(StringFilter(operator=StringOperatorEnum.contains, value=value))

    return col_filt


def __add_dynamic_filter(mavis, df, local_cache, value):
    col_filt = _dynamic_filter_to_model(mavis, df, local_cache, value)

    if col_filt is None:
        return False

    d_obj = _fetch_dataset(mavis, local_cache, df["dataset_slug"])
    d_obj.reset()

    # flag the for the data
    df["action"] = df.get("action") or "include"
    is_override = df["type"] == "current_user_email" or df["action"].endswith("and_override")
    is_not = not (df["type"] == "current_user_email" or df["action"].startswith("include"))

    __get_df_obj(mavis, d_obj, df, is_override, is_not, col_filt)
    return True


def __get_dynamic_filter_values(mavis: Mavis, df, local_cache):
    # if it is a time resolution then make it a text dropdown
    if df["type"] == "time_resolution":
        return "list", RESOLUTIONS[3:-2]
    # handle bad action
    if not df.get("action"):
        df["action"] = "include"

    dataset = _fetch_dataset(mavis, local_cache, df["dataset_slug"])
    dataset.limit = None

    obj = __get_df_obj(mavis, dataset, df, is_override=df["action"].endswith("and_override"))

    if df["kind"] not in ("list", "multi_select"):
        if df["group_slug"].startswith("_edit"):
            col_type = utils.get_simple_type(df["activity_column"]["type"])
        elif df["group_slug"] == "_parent":
            col_type = dataset.model.column(df["column_id"]).type
        elif df["group_slug"].startswith("_prefilter."):
            col_type = dataset.model.column(df["column_id"]).type
        elif df["group_slug"]:
            col_type = dataset.model.tab(df["group_slug"]).column(df["column_id"]).type
        else:
            col_type = dataset.model.column(df["column_id"]).type

        # based on the type choose a type of filter
        if col_type == ColumnTypeEnum.number:
            value_type = "number_range"
        elif col_type == ColumnTypeEnum.string:
            value_type = "text"
        elif col_type == ColumnTypeEnum.timestamp:
            value_type = "time_range"

        return value_type, None

    if df["group_slug"].startswith("_edit"):
        cv = dataset.activity_updator.get_column_values(obj.activity_ids[0])
        value_options = cv.get(df["activity_column"]["name"], [])
        return df["kind"], value_options

    elif df["group_slug"] == "_parent":
        tab = dataset.model.add_group([df["column_id"]])
        col_id = tab.columns[0].id

    # handle adding the filter
    elif df["group_slug"].startswith("_prefilter"):
        tab = dataset.model.add_group([df["column_id"]])
        tab.parent_filters = dataset.model.tab(df["group_slug"].split(".")[-1]).parent_filters
        col_id = tab.columns[0].id
    else:
        tab = dataset.model.tab(df["group_slug"])
        col_id = df["column_id"]

    group_data = dataset.run(tab_slug=tab.slug)
    col = group_data.column(id=col_id)
    # get all the values
    value_options = []
    for r in group_data.rows:
        val = r[col.field] if r[col.field] is not None else "NULL"
        if val not in value_options:
            value_options.append(val)

    return df["kind"], value_options


def apply_dynamic_filters(mavis, config, field_overrides, local_cache, only_dataset=None):
    dynamic_inputs = []
    added = set()

    applied_filters = []

    # add the dynamic field s
    for ii, df in enumerate(config.get("dynamic_filters") or []):
        if (
            (only_dataset is None or only_dataset == df["dataset_slug"])
            and df["name"] not in added
            and df["type"] != "current_user_email"
        ):
            # override the list type
            if df["kind"] == "list_w_default":
                df["kind"] = "list"
                default_to_first = True
            else:
                default_to_first = False

            # get the options and filter type
            (value_type, value_option) = __get_dynamic_filter_values(mavis, df, local_cache)
            if field_overrides:
                default_value = field_overrides.get(df["name"])
            else:
                default_value = None

            # make sure we make the default value an array if it is a list
            if value_type in ("multi_select", "table_variable_multi"):
                default_value = default_value or []

            # make the first one the default
            if default_to_first and len(value_option) > 0:
                default_value = value_option[0]

                # only add it if no value
                if field_overrides.get(df["name"]) is None:
                    field_overrides[df["name"]] = default_value

            # add the input
            dynamic_inputs.append(
                dict(
                    name=df["name"],
                    label=df["label"],
                    value_type=value_type,
                    value_options=value_option,
                    default_value=default_value,
                    required=False,
                    order=100 + ii if df["kind"] != "time_resolution" else 0,
                )
            )
            added.add(df["name"])

        if field_overrides:
            if (only_dataset is None or only_dataset == df["dataset_slug"]) and field_overrides.get(
                df["name"]
            ) is not None:
                # process the dynamic filters
                if df["type"] == "time_resolution":
                    if df.get("dataset_slug"):
                        applied = __apply_time_resolution_swap(mavis, df, local_cache, field_overrides[df["name"]])
                    else:
                        applied = __apply_time_resolution_swap_to_narrative(
                            mavis,
                            config["narrative"],
                            df,
                            field_overrides[df["name"]],
                        )
                else:
                    value = field_overrides[df["name"]]
                    applied = __add_dynamic_filter(mavis, df, local_cache, value)

                # add the filtered user
                if applied:
                    # add the user so the UI knows
                    if df["type"] == "current_user_email":
                        config["filtered_for_user"] = field_overrides[df["name"]]
                    else:
                        applied_filters.append(df["label"])

    return (dynamic_inputs, applied_filters)


@tracer.start_as_current_span("assemble_narrative")
def assemble_narrative(
    mavis,
    narrative_slug,
    cache_minutes=0,
    config=None,
    field_overrides=None,
    override_upload_key=None,
):
    set_current_span_attributes(narrative_slug=narrative_slug, cache_minutes=cache_minutes)

    narrative_updator = NarrativeManager(mavis=mavis)
    try:
        # create a local cache
        local_cache = _get_cache(None, cache_minutes)

        if config is None:
            # get the analysis
            narrative_id = narrative_updator._slug_to_id(narrative_slug)
            config = narrative_updator.get_config(narrative_id)

        # update the field overrides
        if field_overrides is None:
            field_overrides = {}

        dynamic_inputs, applied_filters = apply_dynamic_filters(mavis, config, field_overrides, local_cache)

        # get the graph object
        graph_nar = graph_client.get_narrative_by_slug(company_id=mavis.company.id, slug=narrative_slug).narrative

        if len(graph_nar) > 0:
            # get the timeline actions
            actions = graph_client.get_timeline(timeline_ids=[graph_nar[0].id]).company_timeline
        else:
            actions = []

        # initialize the fields
        created_fields = _create_fields(
            mavis,
            config.get("field_configs") or [],
            narrative=config.get("narrative"),
            cache_minutes=cache_minutes,
            local_cache=local_cache,
            field_overrides=field_overrides,
        )
        fields, _, ordered_config = created_fields

        config["dynamic_fields"] = dynamic_inputs
        # prepend all the values
        for ii, f in enumerate(ordered_config):
            if f.get("set_as_user_input"):
                dynamic_inputs.append(
                    dict(
                        name=f["name"],
                        label=f.get("label", utils.title(f["name"])),
                        value_type=f["dynamic_type"],
                        value_options=(
                            utils.unique_values(fill_in_template(f["dynamic_options"], fields, mavis=mavis))
                            if f.get("dynamic_options")
                            else []
                        ),
                        default_value=fields.get(f["name"]),
                        required=True,
                        order=ii + 1,
                    )
                )

        # sort the dynamic inputs using order
        dynamic_inputs.sort(key=lambda x: x.get("order", 1000))

        # add the filters
        applied_filters = list(set(applied_filters))
        config["selected_filters"] = len(applied_filters)
        config["applied_filters"] = applied_filters
        config["field_overrides"] = field_overrides

        # save the ordered config
        config["field_configs"] = ordered_config
        # create the field array
        config["fields"] = fields

        # fill in the template with the field sand template
        config["narrative"] = process_all_blocks(
            mavis,
            fill_in_template(config["narrative"], config["fields"], mavis=mavis),
            local_cache=local_cache,
            cache_minutes=cache_minutes,
        )

        # run the datasets if needed
        config["datasets"] = fill_in_template(config.get("datasets") or [], config["fields"], mavis=mavis)

        # Add the timeline events
        for s in config["narrative"]["sections"]:
            for c in s["content"]:
                if c.get("type") == "custom_plot":
                    dataset_slug = c["plot_config"]["dataset_slug"]
                    group_slug = c["plot_config"].get("group_slug")

                    # only process the needed datasets
                    d = next(
                        (d for d in config["datasets"] if d["slug"] == dataset_slug and group_slug == d["group_slug"]),
                        None,
                    )
                    if not d:
                        raise SilenceError(
                            "Could not find the dataset and group in the datasets",
                            http_status_code=404,
                        )

                if (
                    len(actions) > 0
                    and c.get("type") == "block_plot"
                    and c["value"]["config"].get("x_type") == ColumnTypeEnum.timestamp
                ):
                    plot_config = c["value"]["plot_config"]
                    add_timeline(
                        plot_config,
                        actions,
                        color="#00AB08",
                    )

        # once the dataset are all used then update them if needed
        # this should only really be used for analyze button
        for _, d in local_cache["_datasets"].items():
            if d.obj.get("_needs_fields") and d.obj["fields"]:
                d.obj["fields"] = local_cache["_fields"]
                d.update()

        maintenance_found = any(v for v in local_cache["_datasets"].values() if v.maintenance_started_at)

        if maintenance_found:
            config["narrative"]["sections"].append(
                dict(
                    title="Data Alert Triggered",
                    id=get_uuid(),
                    content=[
                        dict(
                            id=get_uuid(),
                            type="markdown",
                            text="\n\n".join(
                                [
                                    "# Activity in Maintenance Found",
                                    "During processing this data we found that there were some activities that were undergoing maintenance.  This can affect the data/conclusions of this Narrative",
                                ]
                            ),
                        )
                    ],
                )
            )

        # make sure null is maintained
        actionable_res = config["narrative"].get("is_actionable")
        if actionable_res is None:
            is_actionable = None
        elif actionable_res and not (isinstance(actionable_res, str) and "mavis-error" in actionable_res):
            is_actionable = True
        else:
            is_actionable = False

        # update the is_actiobable in the narrative
        config["narrative"]["is_actionable"] = is_actionable

        # save the has run
        has_run = len(graph_nar) > 0 and len(graph_nar[0].narrative_runs) > 0

        # if there are runs and it changed from actionable to not then tell the user
        if has_run and is_actionable != graph_nar[0].narrative_runs[0].is_actionable:
            user = graph_client.get_user(id=graph_nar[0].created_by).user_by_pk

            template_model = dict(
                narrative_name=graph_nar[0].name,
                narrative_slug=graph_nar[0].slug,
                from_actionable=("actionable" if graph_nar[0].narrative_runs[0].is_actionable else "not actionable"),
                to_actionable="actionable" if is_actionable else "not actionable",
                relative_date=utils.pretty_diff(graph_nar[0].created_at, utils.utcnow(), "past"),
            )
            send_email(
                mavis.company,
                user.email,
                24903205,
                template_model,
                tag="narrative_actionable_change",
            )

        if override_upload_key:
            output_key = narrative_updator.upload_snapshot(narrative_slug, config, override_key=override_upload_key)
        else:
            # upload if needed
            output_key = narrative_updator.upload_snapshot(narrative_slug, config)

            try:
                # save the data in graph
                graph_client.insert_narrative_run(
                    company_id=mavis.company.id,
                    narrative_slug=narrative_slug,
                    s3_key=output_key,
                    is_actionable=is_actionable,
                )
            except Exception:
                raise SilenceError(
                    "Could not save the run because the Narrative was deleted, Please try again or contact support if this persists"
                )

        # create the output file
        output = dict(output_key=output_key, narrative=config)

    except Exception as e:
        raise AssembleNarrativeError(e, company=mavis.company.slug, narrative_slug=narrative_slug) from e

    return output


def markdown_value(key, value):
    if isinstance(value, str) and "#" in key and "\n" not in value:
        return f"`{value}`"
    else:
        return value


@tracer.start_as_current_span("process_all_blocks")
def process_all_blocks(mavis, narrative, local_cache=None, cache_minutes=None):
    for _, s in enumerate(narrative["sections"]):
        new_content = []
        total_content = len(s["content"])

        for c_idx, content in enumerate(s["content"]):
            logger.debug(f"{c_idx}/{total_content} - {content.get('type')}")
            block_content = process_block(mavis, content, local_cache, cache_minutes=cache_minutes)
            utils.extend_list(new_content, block_content)

        s["content"] = new_content

    return narrative


@tracer.start_as_current_span("process_block")
def process_block(mavis, content, local_cache=None, cache_minutes=None):
    local_cache = _get_cache(local_cache, cache_minutes)

    if content.get("type") == "block" or content.get("type") in VALID_BLOCKS and content.get("data"):
        # add the cache to the data
        content["data"]["local_cache"] = local_cache
        b = Block(
            mavis,
            content.get("block") or content.get("type"),
            content["data"],
            ignore_track=True,
        )
        new_content = b.run_data()

        # maintain the id
        if isinstance(new_content, dict):
            new_content["id"] = content.get("id")
        elif isinstance(new_content, list):
            for c in new_content:
                c["id"] = content.get("id")

        # delete the cache from the output
        r = utils.recursive_find(new_content, ["local_cache"], return_obj=True, only_string=False)
        for f in r:
            del f[1][f[0]]

        return new_content
    elif content.get("type") == "metric_v2" and content.get("data"):
        return_content = _process_metric_v2(mavis, local_cache, content["data"])
    elif content.get("type") == "plot_v2" and content.get("data"):
        return_content = _process_plot_v2(mavis, local_cache, content["data"])
    elif content.get("type") == "table_v2" and content.get("data"):
        return_content = _process_table_v2(mavis, local_cache, content["data"])
    else:
        return_content = content

    # add the identifiers that are needed
    for k in ("id", "grid_layout", "column_order"):
        if content.get(k):
            return_content[k] = content[k]

    return return_content


@tracer.start_as_current_span("_process_table_v2")
def _process_table_v2(mavis, local_cache, content):
    # get the results
    dataset = _fetch_dataset(mavis, local_cache, content["dataset_slug"])
    raw_data = dataset.run(content["group_slug"])

    if content.get("as_data_table"):
        raw_data.limit(content.get("limit", UI_TABLE_RENDER))
        if content.get("title"):
            raw_data.context.name = content["title"]

        old_data = raw_data.to_old()
        if old_data["metadata"].get("table_id"):
            old_data["metadata"]["table"] = mavis.company.table(old_data["metadata"]["table_id"]).dict()
        return dict(type="table", value=old_data)
    else:
        len_rows = raw_data.total_rows
        raw_data.limit(content.get("limit", UI_MARKDOWN_TABLE_RENDER))

        # add a note for the render
        if len_rows > UI_MARKDOWN_TABLE_RENDER and not content.get("limit"):
            extra = f"**Table has {utils.human_format(len_rows)} rows but we can only render {UI_MARKDOWN_TABLE_RENDER}.  Use Data table to render up to 1K rows**\n\n"
        else:
            extra = ""

        if content.get("title"):
            raw_data.context.name = content["title"]
            # add the title
            extra = f'### {content["title"]}\n\n {extra}'

        return dict(
            type="markdown",
            value=f"\n\n{extra}{raw_data.pretty()}",
        )


@tracer.start_as_current_span("_process_plot_v2")
def _process_plot_v2(mavis, local_cache, content):
    # catch the missing group slug
    if content.get("group_slug") is None:
        raise SilenceError("A plot has a dataset but NO PLOT was selected")

    # save the group slug
    plot_config = dict(
        dataset=dict(
            tab_slug=content["group_slug"],
            plot_slug=content["plot_slug"].split(".")[-1],
        ),
        annotations=content.get("annotations") or [],
    )
    # get the proper dataset
    dataset = _fetch_dataset(mavis, local_cache, content["dataset_slug"])

    # create the plot object
    plot = DatasetPlot(
        plot_config,
        dataset,
        color_override=content.get("colors", []),
        height=content.get("height") or 480,
    )

    plot_data = plot.run_plot().dict()
    plot_data["config"]["dataset_slug"] = content["dataset_slug"]
    plot_data["config"]["group_slug"] = content["group_slug"]
    return dict(type="block_plot", value=plot_data)


@tracer.start_as_current_span("_process_metric_v2")
def _process_metric_v2(mavis: Mavis, local_cache, content):
    # get the results
    dataset = _fetch_dataset(mavis, local_cache, content["dataset_slug"])
    raw_data = dataset.run(content["group_slug"])

    # get the data
    value = dict(dataset_slug=content["dataset_slug"], group_slug=content["group_slug"])

    try:
        col = raw_data.column(id=content["column_id"])
    except Exception:
        value.update(title="ERROR - COLUMN REMOVED", value="No Data", description=None)

    else:
        for k in ("filters", "compare_filters"):
            for f in content.get(k) or []:
                if (
                    f.get("value")
                    and isinstance(f["value"], str)
                    and (f["value"].endswith("00:00:00+00:00") or f["value"].endswith("00:00:00"))
                ):
                    f["value"] = f["value"][:10]

        row = _get_row_from_filter(mavis, raw_data, content.get("filters") or [])

        if row:
            row_val = row[col.field] if isinstance(row, dict) else row
            value.update(
                title=col.header_name,
                value=mavis.human_format(row_val, format_to_old(col.context.format)),
                description=__get_filter_display(mavis, content.get("filters") or [], raw_data),
            )

            # add the row comparison
            if content.get("compare_filters"):
                compare_row = _get_row_from_filter(mavis, raw_data, content.get("compare_filters"))

                if compare_row:
                    compare_row_val = compare_row[col.field] if isinstance(compare_row, dict) else compare_row
                    # add handling the comparison of the metric
                    if content.get("make_percent_change"):
                        if row_val != 0 and row_val is not None:
                            try:
                                percent_change = (float(row_val) - float(compare_row_val)) / float(row_val)
                            except Exception:
                                percent_change = 0

                            comp_text = mavis.human_format(percent_change, "percent")

                            if percent_change >= 0:
                                comp_text = "+" + comp_text
                            else:
                                comp_text = "-" + comp_text
                        else:
                            percent_change = "NaN"

                        comp_text = mavis.human_format(percent_change, "percent")
                    else:
                        comp_text = mavis.human_format(compare_row_val, format_to_old(col.context.format))

                    if content.get("compare_text"):
                        value["header"] = f'{comp_text} {content["compare_text"]}'
                    else:
                        value["header"] = comp_text

        else:
            value.update(
                title=col.header_name,
                value="No Data",
                description=None,
            )

        if content.get("show_values_in_plot"):
            color = content.get("plot_color" or "#1890ff")

            # handle ordering the plots
            t_plot = DatasetPlot(
                dict(dataset=dict(tab_slug=content["group_slug"])),
                dataset,
            )
            t_plot.generate_columns()
            t_plot.load_data()

            extra_filt = []
            for f in content.get("filters") or []:
                if f.get("column_id") in t_plot.config.columns.color_bys:
                    extra_filt.append(f)

            # Add the filter
            if extra_filt:
                rows = _get_row_from_filter(mavis, t_plot.load_data(), extra_filt, return_all=True)
            else:
                rows = raw_data.rows

            # add the plot
            value["tiny_plot"] = dict(
                chart_type="tiny-area",
                use_antv=True,
                plot_config=dict(
                    data=[r[col.field] for r in rows],
                    smooth=True,
                    areaStyle=dict(
                        fill=f"l(270) 0.2:#ffffff 1:{color}4C",
                    ),
                    line=dict(size=2, color=color),
                    tooltip=dict(narrator_format=col.context.format),
                ),
            )

        # update the name
        if content.get("name"):
            value["title"] = content["name"]

        # use header as the description
        if content.get("description"):
            value["description"] = content["description"]

    # return the data
    return dict(type="raw_metric", value=value)


def __get_filter_display(mavis: Mavis, option, raw_data: TableData):
    if len(option) == 0:
        return ""

    piece = []
    for f in option:
        if not f.get("value"):
            piece.append("NULL")

        elif str(f["value"]) in ("max", "min"):
            agg = str(f["value"])
            col_id = f["column_id"]
            col = raw_data.column(col_id)

            # Add the timestamp
            if col.type in (ColumnTypeEnum.timestamp, ColumnTypeEnum.string):
                agg = agg.replace("max", "last").replace("min", "first")

            piece.append(f"{utils.title(agg)} {col.header_name}")

        else:
            piece.append(
                mavis.human_format(
                    str(f["value"]).split(".")[-1],
                    format_to_old(raw_data.column(f["column_id"]).context.format),
                )
            )

    return " For " + " & ".join(piece)


def _get_row_from_filter(mavis, raw_data: TableData, option, return_all=False):
    raw_data = deepcopy(raw_data)

    # make the rows better
    if raw_data.total_rows == 0:
        return dict()
    if len(option) == 0:
        return raw_data.rows[0]
    else:
        for op in option:
            col = raw_data.column(id=op["column_id"])
            new_rows = []

            # handle the max in the loop
            if op.get("value") and isinstance(op["value"], dict) and op["value"]["value"] in ("max", "min"):
                max_val = _get_row_from_filter(mavis, raw_data, [op["value"]]).get(col.field)
                op["value"] = max_val

            elif op["value"] in ("max", "min"):
                op["value"] = utils.apply_function(op["value"], raw_data.column_values(col))
            elif isinstance(op["value"], str) and op["value"].endswith("non_null"):
                all_vals = [r for r in raw_data.column_values(col) if r is not None]
                len_val = len(all_vals)

                # handle picking the right value
                if len_val == 0:
                    return None
                elif op["value"] == "first_non_null":
                    return all_vals[0]
                elif op["value"] == "last_non_null":
                    return all_vals[-1]
                elif len_val > 1 and op["value"] == "second_non_null":
                    return all_vals[1]
                elif len_val > 1 and op["value"] == "second_last_non_null":
                    return all_vals[-2]
                else:
                    return None

            # remove the data
            for r in raw_data.rows:
                if str(r[col.field]) == str(op.get("value")):
                    new_rows.append(r)

            raw_data.rows = new_rows

        if return_all:
            return raw_data.rows
        elif raw_data.total_rows > 0:
            return raw_data.rows[0]

    return dict()


def _compute_consitency_percent(vec):
    # remove zeros cause we don't have data for them
    current_percent = utils.apply_function("average", vec)

    # Make the vec directornally consistent and 0 if not
    vec = [1 if current_percent * v > 0 else 0 for v in vec if v != 0]
    # keep the same sign
    return copysign(utils.apply_function("average", vec) or 0, current_percent)


def _check_consistency(mavis, trace_data, min_percent=0.8, min_points=3, keys=None, min_date=None):
    (k1, k2) = keys if keys else trace_data.keys()
    td1 = trace_data[k1]
    td2 = trace_data[k2]

    if td1["data"] is None or td2["data"] is None:
        return ConsistentPeriod().dict()

    all_dates = td1["data"]["x"]

    # grab a start date to capture the data for the average
    if min_date:
        avg_start_ii = next((ii for ii, t in enumerate(all_dates) if t >= min_date), 0)
    else:
        avg_start_ii = 0

    pt_consistent = []

    # got through the data and highlight the direction and penialize the missing data
    for r1, r2 in zip(td1["data"]["y"], td2["data"]["y"]):
        if r1 is None or r2 is None or r2 == r1:
            pt_consistent.append(0.0)
        elif r2 > r1:
            pt_consistent.append(-1.0)
        else:
            pt_consistent.append(1.0)

    # create a vector for percent
    all_percents = [0 for _ in all_dates]

    # initialize the vector
    is_currently_consistent = False
    start_ii = 0
    end_ii = start_ii + min_points
    result = ConsistentPeriod()

    # default the variable to something
    result.lower = k1
    result.higher = k2

    # loop through all the data
    while end_ii <= len(pt_consistent):
        # because we set the value we need it to be -1
        pt = end_ii - 1
        # compute the consistency percentage of the data
        # utils.cprint(pt_consistent[start_ii:end_ii])
        all_percents[pt] = _compute_consitency_percent(pt_consistent[start_ii:end_ii])
        # print(all_percents[pt])

        if is_currently_consistent:
            # check if it is flipped
            if (
                # if the percent is less than minimum
                abs(all_percents[pt]) <= min_percent
                # if it flipped (the sign of the current percent and the next MINPOINTS are different)
                or (
                    all_percents[pt] / abs(all_percents[pt]) * sum(pt_consistent[(end_ii - min_points) : end_ii])
                    == -min_points
                )
                # if it is the last point
                or end_ii == len(pt_consistent)
            ):
                # don't bother going back if it is the last point
                if end_ii != len(pt_consistent):
                    while abs(all_percents[pt] or 0) < abs(all_percents[pt - 1] or 0):
                        pt -= 1

                result = ConsistentPeriod(start_date=all_dates[start_ii])
                # handle the alst point and update the averages
                if end_ii != len(pt_consistent):
                    result.end_date = all_dates[pt]

                result.percent = abs(all_percents[pt])

                # get the right direction and the right value
                if all_percents[pt] < 0:
                    first = "lower"
                    second = "higher"
                else:
                    first = "higher"
                    second = "lower"

                # compute the variables
                setattr(result, first, k1)
                setattr(result, second, k2)

                # make sure you use the average from the start point so we don't overlap
                if start_ii < avg_start_ii < pt:
                    setattr(result, first + "_avg", _compute_average(td1, avg_start_ii, pt))
                    setattr(result, second + "_avg", _compute_average(td2, avg_start_ii, pt))
                else:
                    setattr(result, first + "_avg", _compute_average(td1, start_ii, pt))
                    setattr(result, second + "_avg", _compute_average(td2, start_ii, pt))

                start_ii = pt + 1
                end_ii = start_ii + min_points
                is_currently_consistent = False
            else:
                end_ii += 1

        elif abs(all_percents[pt]) == 1.0 and not any(v == 0 for v in pt_consistent[start_ii:end_ii]):
            is_currently_consistent = True
        # then it is not consistent and not good, then reset the line or add a point based on what's better
        else:
            start_ii += 1
            end_ii += 1

    result.current = result.end_date is None and result.start_date is not None

    if start_ii < avg_start_ii < end_ii:
        td1_average = _compute_average(td1, avg_start_ii, end_ii)
        td2_average = _compute_average(td2, avg_start_ii, end_ii)
        result.avg_to_now = (td1_average + td2_average) / 2
    else:
        td1_average = _compute_average(td1, start_ii, end_ii)
        td2_average = _compute_average(td2, start_ii, end_ii)
        result.avg_to_now = (td1_average + td2_average) / 2

    return result.dict()


def __create_group(last_group, len_x, start_ii=None):
    """
    Creates the group by incrementing the last group
    """
    ii = (len(last_group) - 1) if start_ii is None else start_ii

    while ii >= 0:
        if last_group[ii] >= (len_x - 1 - (len(last_group) - ii)):
            ii -= 1
        else:
            last_group[ii] += 1
            ii += 1
            while ii < len(last_group):
                last_group[ii] = last_group[ii - 1] + 1
                ii += 1
            return last_group

    return None


def _find_buckets(
    mavis,
    trace_data,
    size_data,
    kind,
    number_of_buckets=2,
    version=2,
    std_data=None,
    is_decrease=False,
    format_kind=None,
    column_name=None,
):
    """
    Buckets the data into group where the metric has the greatest difference and there is significant amount of data in it
    """
    # create the buckets
    best_buckets = None
    best_score = 0

    metric = np.zeros(number_of_buckets)
    bucket_size = np.zeros(number_of_buckets)
    sigmas = np.ones(number_of_buckets)

    # make this a recursion
    #   - find the bucket
    #   - compute the metrics
    #   - pass the remainder of the data and get the next bucket

    # handle the edge case of no data
    if trace_data is None:
        raise FieldProcessingError("No rows found in the data so cannot create buckets")

    # compute and enumerate the values if there are 2 buckets
    xs = trace_data["x"]
    ys = np.array(trace_data["y"])
    rows = np.array(size_data["y"])

    if len(xs) == 1:
        raise SilenceError("You cannot bucket data if there is only one value")

    total_rows = rows.sum()

    if kind in ("number", "boolean"):
        # check if allthe values are just 1,0, NULL
        if kind == "boolean" or len([x for x in xs if x != "NULL" and int(float(x)) not in (1, 0, None)]) == 0:
            if kind == "boolean":
                new_xs = xs
                good_val = "True"
                bad_val = "False"
                good_name = "True"
                bad_name = "False"
            else:
                new_xs = [int(float(x)) for x in xs]
                good_val = 1
                bad_val = 0

                # define the names
                good_name = column_name
                if "not " in column_name.lower():
                    bad_name = column_name.lower().replace("not ", "")
                else:
                    bad_name = "Not {column_name}"

            x_ys = {x: float(ys[ii]) for ii, x in enumerate(new_xs)}
            x_rows = {x: float(rows[ii]) for ii, x in enumerate(new_xs)}
            x_rates = {x: float(rows[ii] * 1.0 / total_rows) for ii, x in enumerate(new_xs)}

            std_data = {x: (std_data["y"][ii] if std_data else 1) for ii, x in enumerate(new_xs)}

            if std_data or utils.apply_function("abs_max", x_rates.values()) > 1:
                confidence_interval = utils.z_test(
                    x_rows.get(good_val, 0),
                    x_ys.get(good_val, 0),
                    std_data.get(good_val, 0),
                    x_rows.get(bad_val, 0),
                    x_ys.get(bad_val, 0),
                    std_data.get(bad_val, 0),
                )
            else:
                confidence_interval = utils.significance(
                    x_rows.get(good_val, 0),
                    x_rates.get(good_val, 0),
                    x_rows.get(bad_val, 0),
                    x_rates.get(bad_val, 0),
                )

            # this is a conversion one so we will just auto bucket it
            best_buckets = dict(
                kind="boolean",
                groups=[good_val],
                group_names=[good_name],
                metrics=[x_ys.get(good_val, 0)],
                percents=[x_rows.get(good_val, 0) / total_rows],
                else_metric=x_ys.get(bad_val, 0),
                else_percent=x_rows.get(bad_val, 0) * 1.0 / total_rows,
                else_name=bad_name,
                confidence_interval=confidence_interval,
            )
            best_buckets["stat_significant"] = best_buckets["confidence_interval"] > 0.9
            return best_buckets

        else:
            min_rows = total_rows / (number_of_buckets * 3)
            groups = [ii + 1 for ii in range(number_of_buckets - 1)]

    elif kind == ColumnTypeEnum.string:
        min_rows = rows.max() / (number_of_buckets * 4)
        groups = [ii for ii in range(number_of_buckets - 1)]

    # add the ability to deal with error
    if std_data:
        std = np.array(std_data["y"])
    else:
        std = np.ones(ys.size) * ys.std()

    last_score = None

    while groups is not None:
        if kind == "number":
            # for each group compute all the values of the data from the last group to this one
            f = 0
            for gi, ci in enumerate(groups):
                metric[gi] = np.average(ys[f:ci], weights=rows[f:ci])
                sigmas[gi] = np.average(std[f:ci], weights=rows[f:ci])
                bucket_size[gi] = rows[f:ci].sum()
                f = ci

            metric[gi + 1] = np.average(ys[f:], weights=rows[f:])
            sigmas[gi + 1] = np.average(std[f:], weights=rows[f:])
            bucket_size[gi + 1] = rows[f:].sum()

        elif kind == ColumnTypeEnum.string:
            # for each group use the value for the group and the size of that group
            for gi, ci in enumerate(groups):
                metric[gi] = ys[ci]
                sigmas[gi] = std[ci]
                bucket_size[gi] = rows[ci]

            temp_rows = [r for jj, r in enumerate(rows) if jj not in groups]

            metric[gi + 1] = np.average([y for jj, y in enumerate(ys) if jj not in groups], weights=temp_rows)

            # TODO: Do the right sum of the square and all that shit
            sigmas[gi + 1] = np.average(
                [r for jj, r in enumerate(std) if jj not in groups],
                weights=temp_rows,
            )

            bucket_size[gi + 1] = np.sum([r for jj, r in enumerate(rows) if jj not in groups])

        score = utils.apply_function(
            "average",
            [
                __find_impact(
                    total_rows,
                    bucket_size[-1] / total_rows,
                    metric[-1],
                    current_size / total_rows,
                    current_metric,
                    is_decrease,
                )
                for (current_size, current_metric) in zip(bucket_size[:-1], metric[:-1])
            ],
        )

        if kind == "number":
            if last_score:
                temp_score = score
                score *= 1 + (score - last_score) * 3.0 / last_score
                last_score = temp_score
                # print((score - last_score) * 1.0 / last_score)
            else:
                last_score = score

        # evaluate based on equation
        if best_buckets is None or ((bucket_size > min_rows).all() and score > best_score):
            # set as a new score
            if (bucket_size > min_rows).all():
                best_score = score

            if version is not None and int(version) == 2:
                if std_data or utils.apply_function("abs_max", metric) > 1:
                    confidence_interval = min(
                        [
                            utils.z_test(
                                bucket_size[ii],
                                metric[ii],
                                sigmas[ii],
                                bucket_size[ii + 1],
                                metric[ii + 1],
                                sigmas[ii + 1],
                            )
                            for ii in range(len(metric) - 1)
                        ]
                    )
                else:
                    confidence_interval = min(
                        [
                            utils.significance(
                                bucket_size[ii],
                                metric[ii],
                                bucket_size[ii + 1],
                                metric[ii + 1],
                            )
                            for ii in range(len(metric) - 1)
                        ]
                    )

                # Handle Defining the group name
                group_names = []
                for jj, ci in enumerate(groups):
                    if kind == "number":
                        if group_names:
                            group_names.append(
                                f"{mavis.human_format(float(xs[groups[jj-1]]), format_kind)} to {mavis.human_format(float(xs[ci]), format_kind)}"
                            )
                        else:
                            group_names.append(f"<{mavis.human_format(float(xs[ci]), format_kind)}")
                    else:
                        group_names.append(xs[ci])

                best_buckets = dict(
                    kind=kind,
                    groups=[xs[ci] for ci in groups],
                    group_names=group_names,
                    metrics=[m for m in metric[:-1]],
                    percents=[b / total_rows for b in bucket_size[:-1]],
                    else_metric=metric[-1],
                    else_percent=bucket_size[-1] / total_rows,
                    confidence_interval=confidence_interval,
                )

                # only add else name if needed
                if kind == "number":
                    best_buckets["else_name"] = f"{mavis.human_format(float(xs[groups[-1]]), format_kind)}+"

                elif len(ys) == 2:
                    best_buckets["else_name"] = xs[-1]
                else:
                    best_buckets["else_name"] = "Other"

                best_buckets["stat_significant"] = best_buckets["confidence_interval"] > 0.9

            else:
                best_buckets = [xs[ci] for ci in groups]

        start_ii = None
        for jj in range(len(bucket_size)):
            if bucket_size[: (jj + 1)].sum() > (total_rows - min_rows):
                start_ii = jj - 1

        groups = __create_group(groups, len(xs), start_ii=start_ii)

    return best_buckets


def __find_impact(total_rows, percent_a, metric_a, percent_b, metric_b, is_decrease):
    if (metric_a > metric_b and not is_decrease) or (metric_a < metric_b and is_decrease):
        # utils.cprint('Current to OTHER')
        impact = utils.impact_simulator(
            total_rows,
            1,
            percent_b,
            metric_b,
            percent_a,
            metric_a,
        )
    else:
        # utils.cprint('OTHER - CURRENT')
        impact = utils.impact_simulator(
            total_rows,
            1,
            percent_a,
            metric_a,
            percent_b,
            metric_b,
        )
    return abs(impact)


def _find_trend(
    mavis,
    trace_data,
    error_trace=None,
    max_avg_residual_percent_increase=0.2,
    min_points=3,
):
    # NOTE: I stopped the outlier cause we use the min value to control it so it will never matter.  NEED to rethink this approach
    # # keep track of the outliers
    # MAX_OUTLIER = 1
    # outlier_count = 0

    all_dates = trace_data["x"][:-1]
    ys = [ry or 0 for ry in trace_data["y"]][:-1]
    # create a vector for percent
    last_lines = []
    valid_trend_lines = []

    # initialize the vector
    (start_ii, end_ii) = __shift_line(len(ys) + 1, min_points)

    # loop through all the data
    while start_ii >= 0:
        # find the best slope and residual
        current_line = find_line_trend(
            ys[start_ii:end_ii],
            error=error_trace["y"][start_ii:end_ii] if error_trace else None,
            input_x=all_dates[start_ii:end_ii],
        )

        # add the next projections
        min_residual_of_all_lines = utils.apply_function("min", [ll.avg_residual for ll in last_lines if ll])

        # get the difference
        if min_residual_of_all_lines:
            percent_diff = abs(current_line.avg_residual - min_residual_of_all_lines) * 1.0 / min_residual_of_all_lines
        else:
            percent_diff = 0

        # is the line too different so we should make a new line
        if percent_diff > max_avg_residual_percent_increase or start_ii == 0:
            # Line too short, so just move forward
            if (end_ii - start_ii) <= (min_points + 1) and start_ii > 0 and end_ii < len(ys):
                # ship this point
                (start_ii, end_ii) = __shift_line(end_ii, min_points)

            # create new line
            else:
                # see if the last several lines were worse than the current lines
                for temp_line in last_lines[::-1]:
                    if abs(current_line.avg_residual or 0) > abs(temp_line.avg_residual or 0):
                        current_line = temp_line
                    else:
                        break

                valid_trend_lines.insert(0, current_line)
                last_lines = []

                # start the end from where the point starts
                (start_ii, end_ii) = __shift_line(start_ii, min_points)

        else:
            start_ii -= 1
            last_lines.append(current_line)

    # create the output by greabbing the last line
    result = Trend()
    result.all_lines = valid_trend_lines

    if len(valid_trend_lines) > 0:
        # check the end date
        if valid_trend_lines[-1].end_date == all_dates[-1]:
            valid_trend_lines[-1].end_date = None

        # save the values to the results
        for k, v in valid_trend_lines[-1].dict().items():
            setattr(result, k, v)

    # get the last trend values
    if len(valid_trend_lines) > 1:
        result.last_final_y = valid_trend_lines[-2].final_y
        result.last_slope = valid_trend_lines[-2].slope
        result.last_start_date = valid_trend_lines[-2].start_date

    # if the last point was used then the trend is current
    return result.dict()


def __shift_line(pt: int, shift_by: int):
    end_ii = pt - 1
    start_ii = end_ii - shift_by

    return start_ii, end_ii


def _compute_average(td, st_ii, end_ii):
    vec = td["data"]["y"][st_ii:end_ii]

    if len(vec) == 0:
        return 0

    # processing the weighted values
    if td["count"]:
        weights = td["count"]["y"][st_ii:end_ii]
        s = 0
        for x, y in zip(vec, weights):
            s += (x or 0) * (y or 0)

        sum_val = utils.apply_function("sum", weights) or 0
        return (s / sum_val) if sum_val != 0 else 0
    else:
        return utils.apply_function("average", vec)


def find_line_trend(ys, error=None, input_x=None):
    # get the poly fit
    if error:
        w = np.asarray([(e if e != 0 else 0.0000000001) for e in error])
        weights = w / w.sum()
    else:
        weights = None

    xs = np.arange(0, len(ys))
    ys = np.asarray(ys)
    line = np.polyfit(xs, ys, 1, w=weights)

    # compute the error
    y_bar = line[1] + line[0] * xs
    r = y_bar - ys
    sum_r_sq = (r * r).sum()

    if input_x:
        res = utils.guess_date_part(input_x[0], input_x[1])

    return Line(
        y_intercept=line[1],
        slope=line[0],
        final_y=line[1] + line[0] * xs[-1],
        end_date=input_x[-1] if input_x else None,
        start_date=input_x[0] if input_x else None,
        final_x=input_x[-1] if input_x else None,
        first_x=input_x[0] if input_x else None,
        first_y=line[1] + line[0] * xs[0],
        y_projections=[line[1] + line[0] * (xs[-1] + ii) for ii in range(1, 13)],
        x_projections=([utils.date_add(input_x[-1], res, ii) for ii in range(1, 13)] if input_x else None),
        avg_residual=np.sqrt(sum_r_sq) * 1.0 / len(ys),
    )


class AssembleNarrativeError(WrappedError):
    pass


# TODO: DEPRECATE
def process_functions(f_line, aeval):
    while "$$" in f_line:
        # get the next idx but backwards
        idx = f_line.find("$$")
        parens = utils.find_parens(f_line[idx:])

        if len(parens) == 0:
            raise TypeError(f"function is given without parentheses: {f_line}")

        # $ break the components of the function
        func = f_line[idx + 2 : idx + parens[0][0]].strip()
        input_value = f_line[idx + parens[0][0] + 1 : idx + parens[0][1]].strip()

        # split by commas not in parenthesis
        pieces = [
            utils.string_to_value(process_functions(a.strip(), aeval))
            for a in re.split(r",\s*(?![^()]*\))", input_value)
        ]

        # create the piece that will be replaced
        full_func_str = f_line[idx : idx + parens[0][1] + 1]

        new_value = None

        try:
            # process the function
            if func == "format":
                new_value = utils.human_format(pieces[0], pieces[1] if len(pieces) > 1 else None)

            elif func == "date_add":
                new_value = utils.date_add(*pieces)

            elif func == "date_trunc":
                new_value = utils.date_trunc(*pieces)

            elif func == "impact_simulator":
                # copy the impact simulator for
                new_value = utils.impact_simulator(*pieces)

            elif func == "spent_simulator":
                # copy the impact simulator for
                new_value = utils.spent_simulator(*pieces)

            elif func == "latex":
                # copy the impact simulator for
                new_value = f"<span class=“math math-inline”>{pieces[0]}</span>"

            # allow evaluation of math functions or properties
            elif func == "eval":
                # ASTEVAL will error out if any function or method that is not a math function
                new_value = str(aeval(process_functions(input_value, aeval)))

            if new_value:
                f_line = f_line.replace(full_func_str, str(new_value))
            else:
                # if there is '$$' for any reason we should swap it out with just one $
                f_line = f_line[:idx] + f_line[idx + 1 :]

        except Exception as e:
            if "NotImplementedError" in utils.get_error_message(e):
                raise AstevalError(f"Failed to run the asteval for {f_line}. \n{str(e)}")

            # cleaned up the processor
            f_line = f_line.replace(
                full_func_str,
                "ERROR: FAILED TO RUN [{}] error is {}".format(
                    full_func_str.replace("$$", ""), utils.get_error_message(e)
                ),
            )

    return f_line
