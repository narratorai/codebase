import datetime as dt
import json
import math
import random
import re
import statistics
from collections import defaultdict
from decimal import Decimal
from enum import Enum
from graphlib import TopologicalSorter
from io import BytesIO
from time import time

import inflect
import simplejson
import urllib3
from babel.numbers import format_currency, format_percent
from croniter import croniter
from dateutil import tz as dt_tz
from dateutil.relativedelta import relativedelta
from fuzzywuzzy import fuzz
from numpy import percentile as np_percentile
from pydantic import BaseModel, Field
from pyinflect import getAllInflections, getInflection

from core.models.ids import get_uuid

NotificationTypeEnum = Enum(
    value="NotificationType",
    names=[(b.upper(), b) for b in ("success", "info", "warning", "error")],
)


NotificationPlacementEnum = Enum(
    value="NotificationPlacement",
    names=[(b.upper(), b) for b in ("topLeft", "topRight", "bottomLeft", "bottomRight")],
)

BLANK_TS = "T00:00:00"


STREAM_COLUMN_TYPES = dict(
    activity_id="string",
    ts="timestamp",
    revenue_impact="float",
    feature_json="json",
    feature_1="string",
    feature_2="string",
    feature_3="string",
    enriched_activity_id="string",
    activity="string",
    source="string",
    source_id="string",
    anonymous_customer_id="string",
    link="string",
    customer="string",
    activity_occurrence="integer",
    activity_repeated_at="timestamp",
)


class Mapping(BaseModel):
    old_id: str
    question: str | None = None
    new_id: str | None = None
    add_inflection: bool = True


class DatasetInput(BaseModel):
    # TODO Create a model for query, remember to change how query is accessed in the code since
    # it won't be subscriptable anymore
    query: dict
    override_sql: str | None = None
    input_fields: dict = Field(None, alias="fields")


def urlify(s):
    return urllib3.parse.quote(s)


def get_error_message(exc: Exception):
    """
    Get the error message from an exception
    """
    from core.graph.sync_client import GraphQlClientInvalidResponseError

    if isinstance(exc, GraphQlClientInvalidResponseError):
        return exc.response.json()["errors"][0]["message"]
    else:
        return str(exc)


def fix_type(r):
    if isinstance(r, dt.date):
        r = r.isoformat().replace("+00:00", "")  # remove timezone
        if r.endswith(BLANK_TS):
            return r[:10]
        else:
            return r
    elif isinstance(r, str) and r.endswith(BLANK_TS):
        return r[:10]
    elif isinstance(r, Decimal):
        return float(r)
    # elif isinstance(r, str):
    #     return string_to_value(r)
    elif isinstance(r, dict):
        return json.dumps(r)
    else:
        return r


def collapse_list(list_of_lists):
    return [item for sublist in list_of_lists for item in sublist]


def json_loads(data, **kwargs):
    """A custom JSON loading function which passes all parameters to the
    simplejson.loads function."""
    return simplejson.loads(data, **kwargs)


def sort_eq(w):
    # Return the length of the word and the percent caps
    return (
        len(w.old_id)
        + len([1 for k in w.old_id if k == k.upper()]) / len(w.old_id)
        + (0.5 if w.old_id == w.old_id.lower() else 0)
    )


def order_all_words(all_words):
    sorted_words = sorted(all_words, reverse=True, key=sort_eq)
    unique_words = set()

    # deal with the words that are already there
    new_words = []
    for w in sorted_words:
        if w.old_id not in unique_words:
            new_words.append(w)
            unique_words.add(w.old_id)

    return new_words


def make_id(text):
    return f"a{slugify(text[:30])}_{get_uuid()[:8]}"


def fix_key(name):
    if name.isnumeric():
        return "a" + name
    else:
        return name


def pick_best_option(values, default_answers):
    # convert it to an array
    if isinstance(default_answers, str):
        default_answers = default_answers.split(",")

    best_option = None
    best_probability = 0

    ORDER_RATIO = 0.10

    # loop through and find the best optioon
    for ii, answer in enumerate(default_answers):
        for choice in values:
            precent_increase = 1.0

            if isinstance(choice, dict):
                label = choice["label"]

                if choice.get("value"):
                    if choice["value"].startswith("cohort"):
                        precent_increase += 0.5
                    if "feature_" in choice["value"]:
                        precent_increase += 1

            else:
                label = choice
            # pick the label
            label = choice["label"] if isinstance(choice, dict) else choice

            prob = fuzz.partial_token_sort_ratio(label.lower(), answer.lower().strip())
            prob *= precent_increase

            # we multiply best the order ratio so it has to be a lot better to be chosen as the second option
            if prob > (best_probability * 1 + ORDER_RATIO * ii):
                best_option = choice
                best_probability = prob

    return best_option


def get_activity_stream_type(col_name):
    if col_name in ("ts", "activity_repeated_at"):
        return "timestamp"
    elif col_name in ("activity_occurrence", "revenue_impact"):
        return "number"
    else:
        return "string"


def diff_list(original_list, new_list):
    # To find the values that were added to the list
    added = list(set(new_list) - set(original_list))

    # To find the values that were removed from the list
    removed = list(set(original_list) - set(new_list))

    # To find the values that were the same in the original list
    same = list(set(original_list) & set(new_list))

    # added = [nl for nl in new_list if nl not in orginial_list]
    # removed = [ol for ol in orginial_list if ol not in new_list]
    # same = [nl for nl in new_list if nl in orginial_list]
    return (added, removed, same)


def diff_objects(orginial_list, new_list):
    ols = {o["id"]: o for o in orginial_list if o.get("id")}
    nl_ids = [n["id"] for n in new_list if n.get("id")]

    # find the stuff that was added and removed
    added = [nl for nl in new_list if nl.get("id") is None]
    removed = [ol for ol in orginial_list if ol.get("id") and ol.get("id") not in nl_ids]

    # find the stuff that was updated
    updated = [nl for nl in new_list if nl.get("id") and diff_dicts(nl, ols[nl["id"]])]

    return (added, removed, updated)


def nvl(val, v):
    return val if val is not None else v


def markdown_columns(*args):
    r = ['<table width="100%">', "<tr>"]
    # add the columns
    for a in args:
        r.append(f'<td valign="top" width="50%">\n\n{a}\n\n</td>')
    # add the conclusion
    r.append("</tr>")
    r.append("</table>")
    return "\n".join(r)


def is_time(activity_id):
    return activity_id.split("_")[-1].lower().rstrip("s") in (
        "hour",
        "day",
        "week",
        "month",
        "year",
        "quarter",
        "today",
        "yesterday",
    )


def list_activities(dataset_obj):
    activities = dict()
    for activity in dataset_obj["activities"]:
        if activity is None:
            continue
        for ii, a_id in enumerate(activity.get("activity_ids") or []):
            if not is_time(a_id):
                if activity.get("name") or activity.get("slug"):
                    current_name = activity.get("name", slug_path(activity.get("slug"))).lower().split("or")
                    if len(current_name) > ii:
                        activities[a_id] = title(current_name[ii])
                    else:
                        activities[a_id][0]
                else:
                    activities[a_id] = "No Name"
    return activities


def list_activity_slugs(dataset_obj):
    slugs = []
    for activity in dataset_obj["activities"]:
        if activity is None:
            continue
        slugs.extend(activity.get("slug") or [])
        slugs.extend(activity.get("slugs") or [])

        # get all relationship slugs
        for r in activity.get("relationships") or []:
            slugs.extend(r.get("relative_to_activity_slug") or [])

    return slugs


def split_schema_table_name(name):
    pieces = name.split(".")
    if len(pieces) > 1:
        schema = ".".join(pieces[:-1])
        table_name = pieces[-1]
    else:
        # Postgres doesn't say "public.users" -- it just says "users"
        schema = "public"
        table_name = name

    return (schema, table_name)


def find_first_val(desired_list, desired_vals):
    for d in desired_vals:
        if d[0] == "%":
            for v in desired_list:
                if v.endswith(d[1:]):
                    return v

        elif d[-1] == "%":
            for v in desired_list:
                if v.startswith(d[:-1]):
                    return v
        elif d in desired_list:
            return d
    return None


def is_different(dict_obj, graph_obj):
    return any(v != getattr(graph_obj, k) for k, v in dict_obj.items())


def diff_dicts(dict_obj, dict2_obj):
    return any(v != dict2_obj.get(k) for k, v in dict_obj.items())


def clamp(val, minimum=0, maximum=255):
    if val < minimum:
        return minimum
    return maximum if val > maximum else round(val)


def closest_pt(data, key, val):
    return next((d[key] for d in data if d[key] > val), None)


def colorscale(hexstr, scalefactor):
    """
    Scales a hex string by ``scalefactor``. Returns scaled hex string.

    To darken the color, use a float value between 0 and 1.
    To brighten the color, use a float value greater than 1.

    >>> colorscale("#DF3C3C", .5)
    #6F1E1E
    >>> colorscale("#52D24F", 1.6)
    #83FF7E
    >>> colorscale("#4F75D2", 1)
    #4F75D2
    """

    hexstr = hexstr.strip("#")

    if scalefactor < 0 or len(hexstr) != 6:
        return hexstr

    r, g, b = int(hexstr[:2], 16), int(hexstr[2:4], 16), int(hexstr[4:], 16)

    r = clamp(r * scalefactor)
    g = clamp(g * scalefactor)
    b = clamp(b * scalefactor)

    return f"#{r:02x}{g:02x}{b:02x}"


def tic():
    return time()


def toc(tic_time):
    print("Elapsed Time: %.4fseconds" % (time() - tic_time))


class Notification(BaseModel):
    message: str
    description: str | None = None
    type: NotificationTypeEnum = NotificationTypeEnum.INFO
    duration: int = 1  # duration in seconds
    placement: NotificationPlacementEnum = NotificationPlacementEnum.TOPRIGHT


class Line(BaseModel):
    y_intercept: float | None
    slope: float | None
    final_y: float | None
    residual: float | None


TEXT_CHAR_LIMIT = 18
TRACE_FIELDS = {
    "company",
    "branch",
    "code_version",
    "prefix",
    "script",
    "ce",
    "execution_id",
    "adhoc_execution_id",
    "request_id",
    "job_id",
}


def compact_json_dumps(dict):
    return json.dumps(dict, separators=(",", ":"))


def cprint(s):
    if isinstance(s, dict):
        try:
            s = json.dumps(s)
        except Exception:
            s = str(s)
    print(f"\n\n\n\n{s}\n\n\n")


def get_stream_columns():
    columns = [
        "activity_id",
        "ts",
        "source",
        "source_id",
        "anonymous_customer_id",
        "customer",
        "join_customer",
        "activity",
        "feature_json",
        "feature_1",
        "feature_2",
        "feature_3",
        "revenue_impact",
        "link",
        "activity_occurrence",
        "activity_repeated_at",
    ]
    return columns


def get_spend_columns():
    columns = ["impressions", "spend", "clicks"]
    return columns


def sort_stream_columns(columns):
    cd = {c["name"]: c for c in columns}
    ordered_stream_columns = [cd[c] for c in get_stream_columns() if cd.get(c)]
    ordered_stream_columns.extend([c for c in columns if c["name"] not in get_stream_columns()])
    return ordered_stream_columns


def get_activity_columns(activity, include_activity=False, include_super_admin=False, include_customer=True):
    current_columns = dict()
    for c in activity.column_renames:
        c.label = c.label or title(c.name)
        if (
            c.name.startswith("feature_")
            or (c.name == "activity" and include_activity)
            or (c.name != "activity" and c.has_data)
        ):
            current_columns[c.name] = {
                **c.dict(),
                "type": get_simple_type(c.type),
                "mavis_type": c.type,
            }

    for dim in activity.activity_dims:
        for c in dim.dim_table.columns:
            if not current_columns.get(c.name):
                current_columns[c.name] = {
                    **c.dict(),
                    "type": get_simple_type(c.type),
                    "mavis_type": c.type,
                    "enrichment_table": {
                        "schema": dim.dim_table.schema_,
                        "table": dim.dim_table.table,
                        "join_key": dim.dim_table.join_key,
                        "join_key_type": get_simple_type(
                            next(
                                (c.type for c in dim.dim_table.columns if c.name == dim.dim_table.join_key),
                                "string",
                            )
                        ),
                    },
                    "enrichment_table_column": dim.activity_join_column or "activity_id",
                    "slowly_changing_ts_column": dim.slowly_changing_ts_column,
                }

    # add all the slowly changing dims
    if include_customer and getattr(activity.company_table, "slowly_changing_customer_dims", None):
        for dim in activity.company_table.slowly_changing_customer_dims:
            for c in dim.dim_table.columns:
                if not current_columns.get(c.name):
                    current_columns[c.name] = {
                        **c.dict(),
                        "type": get_simple_type(c.type),
                        "mavis_type": c.type,
                        "enrichment_table": {
                            "schema": dim.dim_table.schema_,
                            "table": dim.dim_table.table,
                            "join_key": dim.dim_table.join_key,
                            "join_key_type": next(
                                (c.type for c in dim.dim_table.columns if c.name == dim.dim_table.join_key),
                                "string",
                            ),
                        },
                        "enrichment_table_column": "customer",
                        "slowly_changing_ts_column": dim.slowly_changing_ts_column,
                    }

    # add the activity if needed
    if include_activity:
        current_columns["activity"] = dict(
            id="activity",
            name="activity",
            label="Activity",
            type="string",
            mavis_type="string",
        )

    # add the super admin columns if needed
    current_columns["_activity_source"] = dict(
        id="activity_source",
        name="_activity_source",
        label="activity_source",
        type="string",
        mavis_type="string",
    )
    if include_super_admin:
        current_columns["_run_at"] = dict(
            id="run_at",
            name="_run_at",
            label="run_at",
            type="timestamp",
            mavis_type="timestamp",
        )

    # add the join customer column
    has_source = "anonymous_customer_id" in [c.name for c in activity.column_renames if c.has_data]

    if has_source:
        current_columns["join_customer"] = dict(
            id="join_customer",
            name="join_customer",
            label="Unique Identifier",
            type="string",
            mavis_type="string",
        )

    return sort_stream_columns(list(current_columns.values()))


def get_dataset_summary(dataset):
    name = []
    for a in dataset["activities"]:
        if a["kind"] == "limiting":
            name.insert(0, a["occurrence"])
            name.insert(1, a.get("name") or "NO NAME")
        else:
            name.append(a.get("relationship_slug") or "NO RELATIONSHIP")
            name.append(a.get("name") or "NO NAME")

    # TODO: Add all the filters
    return " ".join(name)


def without_keys(d, keys):
    if d is None:
        return None
    return {x: d[x] for x in d if x not in keys}


def convert_to_byte(obj):
    if isinstance(obj, dict):
        return BytesIO(json.dumps(obj).encode("utf-8"))
    elif isinstance(obj, list):
        return BytesIO("\n".join([json.dumps(o) for o in obj]).encode("utf-8"))
    elif isinstance(obj, bytes):
        return BytesIO(obj)
    else:
        return BytesIO(obj.encode("utf-8"))


def slug_path(slug):
    if isinstance(slug, list):
        return slugify("_or_".join(slug))
    else:
        return slug


def is_or_activity(slug):
    if isinstance(slug, list):
        return len(slug) > 1
    else:
        return False


def find_in_list(list_object, **kwargs):
    for f in list_object:
        found = True
        for k, val in kwargs.items():
            if f[k] != val:
                found = False
                break

        # return the found item
        if found:
            return val

    return None


supported_function = [
    "first_record",
    "last_record",
    "min",
    "abs_max",
    "max",
    "sum",
    "average",
    "median",
    "median_high",
    "median_low",
    "stdev",
    "variance",
    "harmonic_mean",
    "all",
]


def apply_function(func_name, values):
    # remove all the Nones
    values = [string_to_value(v) for v in values if v is not None]
    if len(values) == 0:
        return None

    # add all the values
    if func_name == "all":
        return list(set(values))

    elif func_name == "min":
        return min(values)
    elif func_name == "abs_max":
        return max([abs(v) for v in values])
    # max of a column
    elif func_name == "max":
        return max(values)
    # first value in the column
    elif func_name in (
        "first_record",
        "first",
    ):
        return values[0]
    # last value of a column
    elif func_name in (
        "last_record",
        "last",
    ):
        return values[-1]
    # add all the numbers
    elif func_name == "sum":
        return sum(values)
    # add all the numbers
    elif func_name == "average":
        return statistics.fmean(values)
    # add all the numbers
    elif func_name == "median":
        return statistics.median(values)
    elif func_name == "median_high":
        return statistics.median_high(values)
    elif func_name == "median_low":
        return statistics.median_low(values)
    elif func_name == "stdev":
        return statistics.stdev(values)
    elif func_name == "variance":
        return statistics.variance(values)
    elif func_name == "harmonic_mean":
        return statistics.harmonic_mean(values)
    else:
        raise ValueError(f"Invalid function in dataset metric {func_name}")


def latex(text):
    return f'<span class="math math-inline">{text}</span>'


def good_text(text):
    return f'<div class="mavis-impact good">{text}</div>'


def bad_text(text):
    return f'<div class="mavis-impact bad">{text}</div>'


def color(color, text):
    return f'<span data-color="{color}">{text}</span>'


def _video(cloudflare_id):
    return f'<span class="mavis-video" data-title="my video" data-url="https://cloudflarestream.com/{cloudflare_id}/manifest/video.m3u8"/></span>'


def img_link_w_width(link, width):
    return f'<img style="float: left;" width="{width}" src="{link}">'


def img_link_w_height(link, height):
    return f'<img style="float: left;" height="{height}" src="{link}">'


def callout(text):
    return f"<aside>{text}</aside>"


def create_toggle(title, text):
    return f"<details><summary>{title}</summary>{text}</details>"


def img_link(link):
    return f'<img style="float: left;" src="{link}">'


def iff(cond, true_val, false_val):
    return true_val if cond else false_val


def significance(total_a, conversion_rate_a, total_b, conversion_rate_b):
    if conversion_rate_a in (0, 1) or conversion_rate_b in (0, 1) or conversion_rate_a > 1 or conversion_rate_b > 1:
        return 0

    diff = abs(conversion_rate_a - conversion_rate_b)
    z_a = diff / math.sqrt(conversion_rate_a * (1 - conversion_rate_a) / total_a)
    z_b = diff / math.sqrt(conversion_rate_b * (1 - conversion_rate_b) / total_b)
    desrired_z = min(z_a, z_b)

    z_score_maps = [
        (0.99, 2.56),
        (0.95, 1.96),
        (0.90, 1.65),
        (0.80, 1.282),
        (0.50, 0.674),
        (0.0, 0),
    ]

    percent = next(p for p, z in z_score_maps if desrired_z >= z)
    return percent


def z_test(total_a, metric_a, std_a, total_b, metric_b, std_b):
    diff = abs(metric_a - metric_b)

    desired_z = diff / math.sqrt((std_a / math.sqrt(total_a)) ** 2 + (std_b / math.sqrt(total_b)) ** 2)

    z_score_maps = [
        (0.99, 2.56),
        (0.95, 1.96),
        (0.90, 1.65),
        (0.80, 1.282),
        (0.50, 0.674),
        (0.0, 0),
    ]
    percent = next((p for p, z in z_score_maps if desired_z >= z), 0)
    return percent


def find_fields(full_string):
    return re.findall(r"{(\w+)}", str(full_string))


def safe_format(full_string, fields):
    # I did this instead of .format because sometime the query had a curly bracket in it and i didn't want it to crash
    for k, val in fields.items():
        full_string = full_string.replace(f"{{{k}}}", str(val))
    return full_string


def same_types(t1, t2):
    return get_simple_type(t1) == get_simple_type(t2)


def get_simple_type(kind):
    if kind is None:
        return None
    kind = kind.lower()
    if kind in ("character varying", "character", "text", "string"):
        return "string"
    elif kind in (
        "timestamp without time zone",
        "timestamp with time zone",
        "date",
        "datetime",
        "time",
        "timestamp",
        "timestamptz",
    ):
        return "timestamp"
    elif kind in ("bigint", "integer", "float", "double precision", "numeric", "smallint", "number", "int64"):
        return "number"
    elif kind in ("boolean",):
        return "boolean"
    elif kind in ("json"):
        return "json"
    else:
        return "string"


def title(s):
    """
    creates a clean title to display
    """
    if isinstance(s, str):
        for a in ("'", '"', "_"):
            s = s.strip(a)
        return " ".join(upper_word(j) for j in s.replace("_", " ").replace("-", " ").split(" "))
    else:
        return s


def is_email(s):
    regex = r"^(\w|\.|\_|\-)+[@](\w|\_|\-|\.)+[.]\w{2,3}$"
    return re.search(regex, s) is not None


def create_tab(label, object_key, tab_id=None, redirect_tab_ids=None, info_modal=None):
    raw_data = dict(
        label=label,
        property_names=object_key if isinstance(object_key, list) else [object_key],
        tab_id=tab_id or object_key,
        redirect_tab_ids=redirect_tab_ids or [],
    )
    # add the modal
    if info_modal:
        raw_data["ui:info_modal"] = info_modal

    return raw_data


def in_maintenance(from_time, to_time):
    return from_time and (to_time is None or to_time < from_time)


def singular(value):
    # handle if it is not a real words
    if any(c in value for c in ("_", "-")):
        return value
    pieces = value.strip(" ").split(" ")
    if len(pieces[-1]) > 2:
        lang_p = inflect.engine()
        pieces[-1] = lang_p.singular_noun(pieces[-1]) or pieces[-1]
    return " ".join(pieces)


def plural(value):
    # handle if it is not a real words
    if any(c in value for c in ("_", "-")) or "a" in value.split():
        return value
    pieces = value.strip(" ").split(" ")
    if len(pieces[-1]) > 2:
        lang_p = inflect.engine()
        pieces[-1] = lang_p.plural(pieces[-1]) or pieces[-1]
    return " ".join(pieces)


def pluralize(num, value):
    if num is not None and int(num) != 1:
        return plural(value)
    else:
        return value


def pronoun(word):
    if word[0].lower() in (
        "a",
        "e",
        "i",
        "o",
        "u",
    ):
        return f"an {word}"
    else:
        return f"a {word}"


def space_text(text, chr_limit=None):
    chr_limit = chr_limit or TEXT_CHAR_LIMIT

    # if it is not a text then leave
    if not isinstance(text, str):
        return text
    pieces = text.replace("<br>", "")

    new_text = []
    ii = 0
    for p in pieces:
        ii += 1
        new_text.append(p)
        if (ii > chr_limit and p in (" ", "@")) or (p == "\n" and ii > 0):
            new_text.append("<br>")
            ii = 0

    return "".join(new_text)


def get_inflection(word, tag):
    """
    https://pypi.org/project/pyinflect/ to learn about the gas
    """
    res = getInflection(word, tag=tag)
    return res[0] if res else None


def get_all_inflections(word):
    """
    pos_type = 'A'
    * JJ       Adjective
    * JJR      Adjective, comparative
    * JJS      Adjective, superlative
    * RB       Adverb
    * RBR      Adverb, comparative
    * RBS      Adverb, superlative

    pos_type = 'N'
    * NN       Noun, singular or mass
    * NNS      Noun, plural

    pos_type = 'V'
    * VB       Verb, base form
    * VBD      Verb, past tense
    * VBG      Verb, gerund or present participle
    * VBN      Verb, past participle
    * VBP      Verb, non-3rd person singular present
    * VBZ      Verb, 3rd person singular present
    * MD       Modal
    """
    # {'NN': ('watch',), 'NNS': ('watches',), 'VB': ('watch',), 'VBP': ('watch',), 'VBD': ('watched',), 'VBN': ('watched',), 'VBG': ('watching',), 'VBZ': ('watches',)}
    all_options = (
        "JJ",
        "JJR",
        "JJS",
        "RB",
        "RBR",
        "RBS",
        "NN",
        "NNS",
        "VB",
        "VBD",
        "VBG",
        "VBN",
        "VBP",
        "VBZ",
        "MD",
    )

    # deal with spacing
    piece = slugify(word).split("_")[-1]
    inflections = getAllInflections(piece)
    # deal with verb and noun variations
    return {k: (word.replace(piece, inflections[k][0]) if inflections.get(k) else word) for k in all_options}


def percent_improvement(higher_val, lower_val, higher_is_good=True):
    if higher_is_good:
        return abs((lower_val or 0) - (higher_val or 0)) / (lower_val or 1)
    else:
        return abs((higher_val or 0) - (lower_val or 0)) / (higher_val or 1)


def upper_word(j):
    if len(j) >= 2:
        return j[0].upper() + j[1:]
    else:
        return j


def limit_dict(entry, keys):
    return {k: v for k, v in entry.items() if k in keys}


def array_get(array, key, value):
    return next((a for a in array if a[key] == value), None)


def filter_dict(list_of_dicts, keys):
    out_l = []
    for entry in list_of_dicts:
        out_l.append({k: v for k, v in entry.items() if k in keys})
    return out_l


def get_column_values(raw_data, col_name, skip_null=False):
    return [r[col_name] for r in raw_data.rows if not skip_null or r[col_name]]


def select_columns(raw_data, column_list):
    slug_list = [slugify(c) for c in column_list]
    raw_data.columns = [c for c in raw_data.columns if slugify(c["name"]) in slug_list]
    return raw_data


def is_error(val):
    if isinstance(val, str):
        return "mavis-error" in val or "FAILED:" in val
    elif isinstance(val, list):
        return any(is_error(a) for a in val)
    else:
        return False


def unique_values(column_data):
    vals = list(set(r if r is not None else "NULL" for r in column_data))

    try:
        vals.sort()
    except Exception:
        print("Cannot sort the row")
    return vals


def average(column_data):
    return apply_function("average", column_data)


def median(column_data):
    return apply_function("medain", column_data)


def sum_values(column_data):
    return apply_function("sum", column_data)


def min_values(column_data):
    return apply_function("min", column_data)


def get_idx(column_data, idx):
    if isinstance(column_data, dict) and column_data.get("rows") is not None:
        min_rows = idx if idx >= 0 else abs(idx + 1)
        return dict(
            columns=column_data.get("columns"),
            rows=(column_data["rows"][idx] if len(column_data["rows"]) > min_rows else []),
        )

    else:
        return column_data[idx] if len(column_data) > 0 else None


def first_value(column_data):
    return get_idx(column_data, 0)


def last_value(column_data):
    return get_idx(column_data, -1)


def filter(table, filt_col, val, return_col):
    return [r[slugify(return_col)] for r in table["rows"] if r[slugify(filt_col)] == val]


def filter_gt(table, filt_col, val, return_col):
    return [r[slugify(return_col)] for r in table["rows"] if r[slugify(filt_col)] > val]


def filter_lt(table, filt_col, val, return_col):
    return [r[slugify(return_col)] for r in table["rows"] if r[slugify(filt_col)] < val]


def filter_gte(table, filt_col, val, return_col):
    return [r[slugify(return_col)] for r in table["rows"] if r[slugify(filt_col)] >= val]


def filter_lte(table, filt_col, val, return_col):
    return [r[slugify(return_col)] for r in table["rows"] if r[slugify(filt_col)] <= val]


def greater_than(column_data, value):
    return [c for c in column_data if c is not None and c > value]


def less_than(column_data, value):
    return [c for c in column_data if c is not None and c < value]


def greater_than_equal(column_data, value):
    return [c for c in column_data if c is not None and c >= value]


def less_than_equal(column_data, value):
    return [c for c in column_data if c is not None and c <= value]


def limit_table(table, rows):
    table["rows"] = table["rows"][:rows]
    return table


def max_values(column_data):
    return apply_function("max", column_data)


def variance(column_data):
    return apply_function("variance", column_data)


def harmonic_mean(column_data):
    return apply_function("harmonic_mean", column_data)


def percentile_cont(column_data, percent):
    values = [string_to_value(v) for v in column_data if v is not None]
    return float(np_percentile(values, percent))


def percentile(column_data, percent):
    values = [string_to_value(v) for v in column_data if v is not None]
    return float(np_percentile(values, percent, method="lower"))


def format_value(metric_name: str, value: object, timezone=None, locale=None, currency_used=None):
    if value is None:
        return "NULL"
    if isinstance(value, dt.date):
        value = str(value)
    return human_format(
        value,
        kind=guess_format(metric_name),
        timezone=timezone,
        locale=locale,
        currency_used=currency_used,
    )


def trim_values(column_values, percent):
    column_values.sort()
    num = int(len(column_values) * percent) + 1
    return column_values[num:-num]


def get_decimate_amount(num):
    if num == 0:
        return 0
    else:
        return pow(10, round(math.log10(num))) / 50


def guess_format(metric_name, type=None):
    if not metric_name:
        return None
    type = get_simple_type(type)

    pieces = slugify(metric_name).split("_")

    if (
        (type is None or type == "number")
        and any(
            n in pieces
            for n in (
                "%",
                "rate",
                "rates",
                "likelihood",
                "likelihoods",
                "percent",
                "percents",
            )
        )
        and not any(n in pieces for n in ("top", "row"))
    ):
        return "percent"
    elif (type is None or type == "number") and any(
        n in pieces
        for n in (
            "$",
            "revenue",
            "revenues",
            "rev",
            "price",
            "gmv",
            "mrr",
            "arr",
            "cpc",
            "cpi",
            "tax",
            "taxes",
            "cost",
            "costs",
            "ltv",
            "cac",
            "aov",
            "cost",
            "spent",
            "spend",
            "spending",
            "amount",
            "amounts",
            "equity",
            "arpu",
        )
    ):
        return "revenue"

    elif (type is None or type == "number") and any(n in pieces for n in ("total", "rows", "count", "sum")):
        return "number"
    elif (type is None or type == "timestamp") and any(
        r in pieces for r in ("day", "week", "month", "year", "quarter")
    ):
        # return the right type
        if "month" in pieces:
            return "month"
        elif "week" in pieces:
            return "week"
        elif "quarter" in pieces:
            if "offset" in pieces:
                return "month"
            else:
                return "quarter"
        elif "year" in pieces:
            return "year"
        else:
            return "date_short"
    elif type == "timestamp" or (type is None and any(r in pieces for r in ("minutes", "hour", "at", "time"))):
        return "time"
    elif (type is None or type in ("number", "string")) and any(
        n in pieces for n in ("id", "link", "url", "identifier", "customer", "email", "slug")
    ):
        return "id"
    else:
        return type


def utcnow():
    return dt.datetime.now(dt.UTC).isoformat()[:19]


def guess_date_part(from_date, to_date):
    from_date = todt(from_date)
    to_date = todt(to_date)
    diff = to_date - from_date
    second_diff = abs(diff.seconds)
    day_diff = abs(diff.days)

    if day_diff >= 365:
        return "year"
    elif day_diff >= 28:
        return "month"
    elif day_diff > 1:
        return "week"
    elif day_diff == 1:
        return "day"
    elif second_diff / 3600 > 1:
        return "hour"
    elif second_diff / 60 > 1:
        return "minute"
    else:
        return "second"


def todt(s):
    if isinstance(s, str):
        if len(s) == 10:
            s += "T00:00:00"
        return dt.datetime.fromisoformat(s.replace("+00:00", "")).replace(tzinfo=dt.UTC)
    else:
        return s


def date_diff(from_date, to_date, datepart):
    from_date = todt(from_date)
    to_date = todt(to_date)
    # fid the s
    datepart += "" if datepart.endswith("s") else "s"

    diff = to_date - from_date
    second_diff = abs(diff.seconds)
    day_diff = abs(diff.days)

    # the dict
    res = dict(
        seconds=(1, 24 * 60 * 60),
        minutes=(1 / 60, 24 * 60),
        hours=(1 / 3600, 24),
        days=(0, 1),
        weeks=(0, 1 / 7),
        months=(0, 1 / 30),
        quarters=(0, 1 / 90),
        years=(0, 1 / 365),
    )
    # deal with the output
    return round(second_diff * res[datepart][0] + day_diff * res[datepart][1], 1)


def date_add(date, datepart, number, warehouse=None):
    if isinstance(date, dt.date):
        date = dt.datetime(date.year, date.month, date.day)

    if not isinstance(date, dt.datetime):
        date = todt(date)

    if datepart.startswith("quarter"):
        number *= 3
        datepart = "month"

    if not datepart.endswith("s"):
        datepart += "s"
    date += relativedelta(**{datepart: number})

    val = date.isoformat()

    if val.endswith(BLANK_TS) and warehouse != "mssql_odbc":
        val = val[: -len(BLANK_TS)]

    return val


def unix_time(date):
    if isinstance(date, dt.date):
        date = dt.datetime(date.year, date.month, date.day)

    if not isinstance(date, dt.datetime):
        date = todt(date)

    return date.timestamp()


def date_trunc(date, datepart, warehouse=None, offset=None):
    if isinstance(date, dt.date):
        date = dt.datetime(date.year, date.month, date.day)

    if not isinstance(date, dt.datetime):
        date = todt(date)

    # loop through the objects
    if datepart.startswith("year"):
        date = date.replace(month=1, day=1, minute=0, hour=0, second=0, microsecond=0)

    elif datepart.startswith("quarter"):
        date = date.replace(
            month=1 + int((date.month - 1) / 3) * 3,
            day=1,
            minute=0,
            hour=0,
            second=0,
            microsecond=0,
        )

    elif datepart.startswith("month"):
        date = date.replace(day=1, minute=0, hour=0, second=0, microsecond=0)

    elif datepart.startswith("week"):
        if warehouse == "bigquery":
            date = date.replace(minute=0, hour=0, second=0, microsecond=0) - dt.timedelta(days=date.isoweekday())
        else:
            date = date.replace(minute=0, hour=0, second=0, microsecond=0) - dt.timedelta(days=date.isoweekday() - 1)

        # Handle the offset
        if offset:
            date += dt.timedelta(days=offset)

    elif datepart.startswith("day"):
        date = date.replace(minute=0, hour=0, second=0, microsecond=0)

    elif datepart.startswith("hour"):
        date = date.replace(minute=0, second=0, microsecond=0)

    elif datepart.startswith("second"):
        date = date.replace(second=0, microsecond=0)

    val = date.isoformat()

    # SQL server adds BLANK TS on the trunc
    if val.endswith(BLANK_TS) and warehouse != "mssql_odbc":
        val = val[: -len(BLANK_TS)]

    return val


def impact_simulator(total_input, percent_shift, percent_from, rate_from, percent_to, rate_to):
    current_impact = total_input * (percent_from * rate_from + percent_to * rate_to)

    d_rate = percent_shift * percent_from
    new_impact = total_input * ((percent_from - d_rate) * rate_from + (percent_to + d_rate) * rate_to)

    lift = (new_impact - current_impact) / current_impact
    return lift


def expand_table(table, default_key=None):
    if isinstance(table, dict):
        table_name = table["table"]
        schema_name = table["schema"]
        join_key = table.get("join_key")
    else:
        table_name = table
        schema_name = None
        join_key = default_key

    return (schema_name, table_name, join_key)


def spent_simulator(best_cac, best_cac_spent, worst_cac, worst_cac_spent, percent_shift):
    expected = best_cac_spent / best_cac + worst_cac_spent / worst_cac
    expected_w_change = (1.0 - percent_shift) * worst_cac_spent / worst_cac + (
        best_cac_spent + percent_shift * worst_cac_spent
    ) / best_cac

    return expected_w_change - expected


def localnow(tz):
    return make_local(utcnow(), tz)


def make_local(timestamp, tz, pretty=False):
    new_time = _convert_tz(timestamp, to_tz=tz)
    if pretty:
        if "america" in tz.lower():
            return new_time.strftime("%m/%d/%Y %I:%M %p")
        else:
            return new_time.strftime("%d/%m/%Y %I:%M %p")
    else:
        return new_time.isoformat()


def make_utc(timestamp, tz):
    return _convert_tz(timestamp, from_tz=tz).isoformat()


def _convert_tz(timestamp, from_tz="UTC", to_tz="UTC"):
    from_time = todt(timestamp)

    from_time = from_time.replace(tzinfo=dt_tz.gettz(from_tz))
    return from_time.astimezone(dt_tz.gettz(to_tz))


HUMAN_FORMATS = [
    dict(id="number", label="Number"),
    dict(id="percent", label="percent"),
    dict(id="revenue", label="Revenue"),
    dict(id="date_short", label="Date Short"),
    dict(id="date", label="Date"),
    dict(id="month", label="Month"),
    dict(id="week", label="week"),
    dict(id="quarter", label="Quarter"),
    dict(id="year", label="Year"),
    dict(id="time", label="Time"),
    dict(id="text", label="Text"),
    dict(id="table", label="Table"),
]


## Added this just because I needed a new name for the inputs to work
def hf(num, kind, timezone=None, locale=None, currency_used=None):
    return human_format(num, kind, timezone, locale, currency_used)


def human_format(num, kind=None, timezone=None, locale=None, currency_used=None):
    # Handle the None case
    if num is None:
        return num

    if isinstance(num, str) and (
        kind in ("date", "d", "month", "year", "week", "quarter", "date_short") or num[10:19] == "T00:00:00"
    ):
        try:
            parsed_date = todt(num)
        except Exception:
            return num

        if kind == "month":
            return parsed_date.strftime("%B %Y")
        elif kind == "year":
            return parsed_date.strftime("%Y")
        elif kind == "week":
            return parsed_date.strftime("Week of %d %B %Y")
        elif kind == "quarter":
            d = parsed_date
            return parsed_date.strftime("%Y Q") + str(int((d.month - 1) / 3) + 1)
        elif kind == "date_short":
            if timezone and "europe" in timezone.lower():
                return parsed_date.strftime("%d/%m/%Y")
            else:
                return parsed_date.strftime("%m/%d/%Y")
        else:
            return parsed_date.strftime("%d %B %Y")

    # just return the exact value if id
    elif kind == "id":
        return str(num)

    elif kind in ("time", "t"):
        # convert to local time
        try:
            pretty_string = f"{make_local(num[:19], timezone, pretty=True)} ({pretty_diff(num, utcnow(), kind=None)})"
            return pretty_string
        except Exception:
            # for the times where it is not an available iso
            return title(num)

    # Deal with Tables
    elif kind == "table" and isinstance(num, dict) and "columns" in num.keys():
        header = (
            "| "
            + " |".join([c.get("header_name") or c.get("friendly_name") or title(c["name"]) for c in num["columns"]])
            + " |"
        )
        output_str = [header]

        # create the line underneath
        row_str = ["|"]
        # go through all the columns
        for c in num["columns"]:
            align = c.get("align") or "left"
            d_line = "-" * len(c.get("friendly_name") or c.get("name") or c.get("header_name") or c.get("field"))

            if align == "right":
                row_str.extend([d_line, ":|"])
            elif align == "left":
                row_str.extend([":", d_line, "|"])
            else:
                row_str.extend([":", d_line, ":|"])

        output_str.append("".join(row_str))

        for c in num["columns"]:
            c["format"] = c.get("format", guess_format(c["name"]))

        # create the body
        for r in num["rows"]:
            # create the row of values
            output_str.append(
                "| "
                + " |".join(
                    [
                        (
                            str(
                                human_format(
                                    r.get(slugify(c.get("field") or c.get("name"))),
                                    c["format"],
                                    timezone=timezone,
                                    locale=locale,
                                    currency_used=currency_used,
                                )
                                or " - "
                            )
                            .replace("|", " ")
                            .replace("\n", "<br>")
                        )
                        for c in num["columns"]
                    ]
                )
                + " |"
            )

        return "\n".join(output_str)

    # handle the string case
    elif isinstance(num, str) or kind in ("text", "s"):
        if any(ch in str(num) for ch in ["@", "/"]):
            return str(num)
        else:
            return title(str(num))

    elif isinstance(num, dict):
        return num
    elif isinstance(num, list):
        return " and ".join([str(n) for n in num])

    # format the percent
    if kind in ("percent", "%"):
        # add more suffixes if you need them
        if num < 0.1:
            return format_percent(round(num, 4), locale=locale or "en_US", decimal_quantization=False)
        elif num < 0.2:
            return format_percent(round(num, 3), locale=locale or "en_US", decimal_quantization=False)
        elif num > 10:
            return human_format(num, "number") + "x"
        else:
            return format_percent(num, locale=locale or "en_US")

    magnitude = 0
    while abs(num) >= 1000:
        magnitude += 1
        num /= 1000.0

    desired_mag = ["", "k", "M", "B", "T", "P"][magnitude]

    if kind in ("revenue", "$"):
        if magnitude > 0:
            if abs(num) < 10:
                # add more suffixes if you need them
                format_num = f"{round(num, 2):.2f}{desired_mag}"
            elif abs(num) < 100:
                # add more suffixes if you need them
                format_num = f"{round(num, 1):.1f}{desired_mag}"
            else:
                # add more suffixes if you need them
                format_num = "%d%s" % (round(num), desired_mag)
        else:
            # add more suffixes if you need them
            format_num = f"{round(num, 2):.2f}{desired_mag}"

        return (
            format_currency(
                3,
                (currency_used or "USD").upper(),
                currency_digits=False,
                locale=locale or "en",
            )
            .replace("3.00", format_num)
            .replace("3,00", format_num)
        )
    else:
        # add more suffixes if you need them
        value = f"{round(num, 3):.3g}{desired_mag}"
        return value


def remove_all_in_quote(s):
    is_quotes = False
    out_s = []
    for p in str(s):
        if p in ('"', "'"):
            is_quotes = not is_quotes
        elif not is_quotes:
            out_s.append(p)
    return "".join(out_s)


def find_parens(s, sort_data=True, error=False, parens=("(", ")")):
    toret = {}
    pstack = []

    for i, c in enumerate(s):
        if c == parens[0]:
            pstack.append(i)
        elif c == parens[1]:
            if len(pstack) == 0:
                if error:
                    raise ValueError(f"No matching closing parens at: {i}")
            else:
                toret[pstack.pop()] = i

    if len(pstack) > 0 and error:
        raise ValueError("No matching opening parens at: " + str(pstack.pop()))

    if sort_data:
        return [(k, toret[k]) for k in sorted(toret)]
    else:
        return toret


def string_to_value(s):
    if not isinstance(s, str):
        return s
    elif s.rstrip().lower() in (
        "true",
        "false",
    ):
        return s.lower() == "true"
    elif s.rstrip() in ("nan"):
        return s
    elif s.rstrip().isdigit():
        return int(s)
    # elif s.startswith('['):
    #     return eval(s)
    else:
        try:
            return float(s)
        except Exception:
            return s


def get_type(s):
    options = [(str, "string"), (bool, "boolean"), (int, "number"), (float, "number")]
    # loop and find the right value
    for o_instance, o_type in options:
        if isinstance(s, o_instance):
            return o_type
    return None


def slugify(string: str | None, replace_with="_"):
    """
    creates a clean title to display
    """
    if string is None:
        return None
    elif not isinstance(string, str):
        return str(string)
    else:
        return re.sub("[^A-Za-z0-9]+", replace_with, string.lower()).rstrip(replace_with)


def to_camel_case(snake_str):
    """Convert a snake_case string to camelCase."""
    components = snake_str.split("_")
    # Capitalize the first letter of each component except the first one
    return components[0] + "".join(x.title() for x in components[1:])


IGNORE_LIST = get_stream_columns() + get_spend_columns()


# update the narrative with the word mapping
def replace_str(s: str, word_mapping: list[Mapping] = None):
    for wm in word_mapping:
        if (
            s not in IGNORE_LIST
            and wm.new_id
            and (
                # if it is an exact only replace it if it is a perfect fit
                not wm.new_id.endswith("_exact") or s == wm.old_id
            )
        ):
            s = s.replace(wm.old_id, wm.new_id)

    return s


def indent(string, num):
    return "{}{}".format("\t" * num, string)


def get_required_fields(string: str):
    return re.findall(r"{(\w+)}", string)


def remove_quotes(string: str) -> str:
    return string.replace('"', "").replace("'", "")


def replace_quotes(string: str) -> str:
    return string.replace('"', '\\"').replace("'", "\\'")


def single_line(s: str) -> str:
    return " ".join(s.split())


def extend_list(the_list, new_obj):
    """
    Handles adding an array or a object to a list
    """
    if isinstance(new_obj, list):
        the_list.extend(new_obj)
    else:
        the_list.append(new_obj)


def queryify(obj, **kwargs):
    """
    if it is an object that we support then run to query on it
    """
    if isinstance(obj, list):
        return ", ".join([queryify(o, **kwargs) for o in obj])
    elif hasattr(obj, "to_query"):
        return obj.to_query(**kwargs)
    else:
        return str(obj)


### Logging / Observability Utils ###
def sanitize_event(fields):
    """
    Prepare an event for logging / transport
    """
    if "query" in fields:
        fields["query"] = sanitize_query(fields["query"])

    if "headers" in fields:
        for header in ["cookie", "Cookie", "authorization", "Authorization"]:
            if fields["headers"].get(header) is not None:
                fields["headers"][header] = "[REDACTED]"

    return fields


def sanitize_query(query):
    """
    Sanitize queries before logging or transporting them
    """
    if query:
        # sometimes the query object is a string and sometimes it's a dict with a 'query' key in it
        if isinstance(query, dict) and "query" in query:
            query = query["query"]

        if isinstance(query, str):
            # Redshift
            # redshift-specific regex for the copy / unload commands: https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-authorization.html
            # and the create / alter user commands

            # BigQuery
            # to the best of our knowledge BigQuery does NOT support commands like COPY that take authorization
            # https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#literals
            # Create user / copy files from a cloud bucket can only be done through APIs or web UI
            regex = "(access_key_id|secret_access_key|session_token|iam_role|credentials|password)\\s+'([^']+)'"
            return re.sub(regex, "*secret*", query, flags=re.IGNORECASE)
    return query


def script_params_to_tags(script_params=None, prefix=None):
    # handle error states
    if not script_params:
        return None

    if not prefix:
        prefix = ""

    tags = []

    # convert script params to tags
    for k, v in script_params.items():
        if isinstance(v, list):
            # add all the objects
            for per_v in v:
                tags.append(f"{prefix + k}:{per_v}")

        elif isinstance(v, dict):
            tags.extend(script_params_to_tags(v, prefix=k + "."))
        else:
            # add the object to the dict
            tags.append(f"{prefix + k}:{v}")

    return tags


def new_color():
    return "#" + "".join(
        [random.choice("0123456789ABCDEF") for _ in range(6)]  # noqa: S311
    )


def remove_enums(obj):
    if isinstance(obj, dict):
        # return {k: recursive_update(v, func, **kwargs) for k, v in obj.items()}
        for k, v in obj.items():
            obj[k] = remove_enums(v)

    elif isinstance(obj, list):
        # add all the objects
        return [remove_enums(r) for r in obj]
    elif isinstance(obj, Enum):
        return obj.value
    return obj


def remove_keys(obj, keys):
    if isinstance(obj, dict):
        for k in keys:
            obj.pop(k, None)
        return {k: remove_keys(v, keys) for k, v in obj.items()}
    elif isinstance(obj, list):
        # add all the objects
        return [remove_keys(r, keys) for r in obj]
    return obj


def recursive_apply(obj, func, **kwargs):
    proceed_vals = []
    if isinstance(obj, str):
        val = func(obj, **kwargs)
        return val if isinstance(val, list) else [val]
    elif isinstance(obj, dict):
        for _, v in obj.items():
            proceed_vals.extend(recursive_apply(v, func, **kwargs))
    elif isinstance(obj, list):
        # add all the objects
        for v in obj:
            proceed_vals.extend(recursive_apply(v, func, **kwargs))
    return proceed_vals


def recursive_update(obj, func, **kwargs):
    if isinstance(obj, str):
        return func(obj, **kwargs)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            obj[k] = recursive_update(v, func, **kwargs)

    elif isinstance(obj, list):
        # add all the objects
        return [recursive_update(r, func, **kwargs) for r in obj]
    return obj


def recursive_find(obj, keys, return_obj=False, only_string=True):
    output = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in keys and (isinstance(v, str) or not only_string):
                output.append((k, obj) if return_obj else v)
            else:
                output.extend(recursive_find(v, keys, return_obj, only_string))

    elif isinstance(obj, list):
        # add all the objects
        for v in obj:
            if isinstance(v, dict):
                output.extend(recursive_find(v, keys, return_obj, only_string))
    return output


def tags_to_script_params(tags):
    # make the tags in the  script params object
    list_objects = ["enriched_activities", "run_after", "depends_on"]

    script_params = dict()

    # clean up the script
    for t in tags:
        # parse the object
        if ":" in t:
            (key, value) = t.split(":")

            pieces = key.split(".")
            temp = script_params

            # deal with opening up the nesting
            for a in pieces[:-1]:
                temp = temp.get(a, {})

            # deal with the array
            if pieces[-1] in list_objects:
                if pieces[-1] in temp.keys():
                    temp[pieces[-1]].append(value)
                else:
                    temp[pieces[-1]] = [value]
            else:
                temp[pieces[-1]] = value

    return script_params


def process_input(prompt, options, key=None, help_prompt="No help available", return_idx=False):
    full_prompt = ["-" * 20, prompt, ""] if prompt else []
    # add all the options
    for ii, val in enumerate(options):
        if key:
            full_prompt.append(f"[{ii + 1}] {val[key]}")
        else:
            full_prompt.append(f"[{ii + 1}] {val}")

    full_prompt.append("")
    full_prompt.append("type ? for help")
    print("\n".join(full_prompt))

    # get the input from the user
    chosen_index = input().strip()
    if chosen_index == "":
        return None
    if chosen_index == "?":
        print(help_prompt)
        return process_input(prompt, options)
    try:
        return int(chosen_index) - 1 if return_idx else options[int(chosen_index) - 1]
    except Exception as e:
        print(f"Invalid Input ({e!s}), please try again or hit (Enter) to exit \n")
        return process_input(prompt, options)


def rec_dd():
    return defaultdict(rec_dd)


def dict_to_rec_dd(obj):
    if isinstance(obj, dict):
        r = rec_dd()
        for k, v in obj.items():
            if isinstance(v, list):
                r[k] = []
                for tv in v:
                    r[k].append(dict_to_rec_dd(tv))
            else:
                r[k] = dict_to_rec_dd(v) if k != "local_cache" else v
        return r
    else:
        return obj if obj != "none" else None


def rec_dd_dict(obj, remove_keys=None):
    if remove_keys is None:
        remove_keys = []
    if isinstance(obj, defaultdict):
        r = dict()
        for k, v in obj.items():
            if k in remove_keys:
                continue
            if isinstance(v, list):
                r[k] = []
                for tv in v:
                    r[k].append(rec_dd_dict(tv, remove_keys=remove_keys))
            else:
                val = rec_dd_dict(v, remove_keys=remove_keys)
                if val != {}:
                    r[k] = val
        return r
    else:
        return obj


def hf_date_diff(from_date, to_date):
    return pretty_diff(from_date, to_date, kind=None)


def pretty_duration(second_diff, day_diff, kind=None):
    if second_diff < 0:
        name = ""

    if day_diff == 0:
        if second_diff < 60:
            name = f"{round(second_diff)} seconds"
        elif second_diff < 120:
            name = "a minute"
        elif second_diff < 3600:
            name = f"{round(second_diff / 60)} minutes"
        elif second_diff < 7200:
            name = "an hour"
        elif second_diff < 86400:
            name = f"{round(second_diff / 3600)} hours"
    elif day_diff == 1:
        if kind == "future":
            return "Tomorrow"
        else:
            return "Yesterday"

    elif day_diff < 7:
        name = f"{round(day_diff)} days"
    elif day_diff < 31:
        name = f"{round(day_diff / 7)} weeks"
    elif day_diff < 365:
        name = f"{round(day_diff / 30)} months"
    else:
        name = f"{round(day_diff / 365)} years"

    if kind == "past":
        name = f"{name} ago"
    elif kind == "future":
        name = f"in {name}"

    return name


def pretty_diff(from_date, to_date=None, kind=None):
    if to_date is None:
        to_date = utcnow()

    from_date = todt(from_date)
    to_date = todt(to_date)

    if kind is None:
        if to_date >= from_date:
            kind = "past"
        else:
            kind = "future"

    diff = to_date - from_date

    second_diff = abs(diff.seconds)
    day_diff = abs(diff.days)
    return pretty_duration(second_diff, day_diff, kind)


def now_tz(timezone: str, now: dt.datetime | None = None):
    if now is None:
        now = dt.datetime.now(dt.UTC)
    return _convert_tz(now, to_tz=timezone)


def _fix_cron(cron: str, consistent_ts: dt.datetime | None = None) -> str:
    # Replace ? with a consistent piece of time (often we use created at of the object)
    if not consistent_ts:
        consistent_ts = todt("1900-02-04T03:08")

    part_replace = [
        consistent_ts.minute,
        consistent_ts.hour,
        consistent_ts.day,
        consistent_ts.month,
        3,
    ]
    parts = cron.split(" ")
    parts = [p if p != "?" else str(part_replace[ii]) for ii, p in enumerate(parts)]
    fixed = " ".join(parts)

    if not croniter.is_valid(fixed):
        raise ValueError(f"Invalid cron definition {fixed}")

    return fixed


def last_run(timezone: str, cron: str, now: dt.datetime = None, consistent_ts: dt.datetime = None) -> dt.datetime:
    now = now_tz(timezone, now)
    cron = _fix_cron(cron, consistent_ts)

    last_time = croniter(cron, now).get_prev(dt.datetime)
    return last_time


def next_run(timezone: str, cron: str, now: dt.datetime = None, consistent_ts: dt.datetime = None) -> dt.datetime:
    now = now_tz(timezone, now)
    cron = _fix_cron(cron, consistent_ts)

    next_time = croniter(cron).get_next(dt.datetime, start_time=now)
    return next_time


def should_cron_run(timezone: str, cron: str, now: dt.datetime = None, consistent_ts: dt.datetime = None):
    """
    Checks if the given cron should be run now. Does NOT actually run it
    """
    now = now_tz(timezone, now)
    cron = _fix_cron(cron, consistent_ts)

    return croniter.match(cron, now)


def sort_jobs_by_dependency(jobs):
    """
    Given an array of Job objects with ids and depends_on properties, determine the order they should be run
    NOTE: this only supports single dependencies at this time. It could support multiple with some tweaks
    """
    dependencies = {j.id: {j.depends_on} if j.depends_on else set() for j in jobs}
    order = list(TopologicalSorter(dependencies).static_order())
    jobs_dict = {j.id: j for j in jobs}
    ordered_jobs = [jobs_dict.get(id) for id in order]
    return ordered_jobs


def sort_by_dependency(items, list_key, id_key):
    """
    Given an array of itesms  with ids and id_key properties, determine the order they should be run
    ^^ This is just like the obove but a bit more generic TODO Make them the same
    """
    item_dict = {i.id: i for i in items}
    order_dict = {i.id: set(getattr(a, id_key) for a in getattr(i, list_key)) for i in items}

    orders = list(TopologicalSorter(order_dict).static_order())
    ordered_items = [item_dict[o] for o in orders if o in item_dict.keys()]
    return ordered_items


# ----- Pivot  --------
def pivot_data(rows, keep_columns, pivot_by):
    """
    PIVOT_DATA:
        - this assumes rows
    """

    # make sure they are objects
    if not isinstance(keep_columns, list):
        keep_columns = [keep_columns]

    if not isinstance(pivot_by, list):
        pivot_by = [pivot_by]

    pivoted_rows = []

    for row in rows:
        # find the row we are pivoting on
        update_row = _find_update_row(pivoted_rows, row, keep_columns)

        if update_row is None:
            # append a new row
            pivoted_rows.append(
                dict(
                    **{k: item for k, item in row.items() if k in keep_columns},
                    pivot=dict(),
                )
            )
            update_row = pivoted_rows[-1]

        # update the update row
        new_pivot = _create_pivot_row(row, keep_columns, pivot_by)

        # check to make sure we are filter before the pivot
        if new_pivot.keys()[0] in update_row["pivot"].keys():
            raise ValueError("You are pivoting a row that has duplications which is not supported")

        # merge the rows
        update_row["pivot"] = {**update_row["pivot"], **new_pivot}

    return pivoted_rows


def _find_update_row(pivoted_rows, row, keep_columns):
    # look through the array backward to see if it works
    for r in pivoted_rows[::-1]:
        for k in keep_columns:
            if r[k] != row[k]:
                break
        else:
            return r
    return None


def _create_pivot_row(row, keep_columns, pivot_by):
    # create the value  and key
    values = {k: item for k, item in row.items() if k not in keep_columns and k not in pivot_by}
    key = "-".join([row[p] for p in pivot_by])
    return {key: values}
