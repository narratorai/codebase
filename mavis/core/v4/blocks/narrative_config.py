import json

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.reports.utils import NarrativeUpdator
from core.constants import DATASET_KEYS
from core.graph import graph_client
from core.util.opentelemetry import tracer
from core.v4.analysisGenerator import _get_all_names, fields_to_autocomplete
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _drop_down,
    _get_narrative,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)

# from core.v4.createDataset import get_activity_columns
from core.v4.dataset_comp.query.model import (
    DatasetKindEnum,
    DetailKindEnum,
    TabKindEnum,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import ALL_TYPES, RESOLUTIONS

TITLE = "Narrative Global Config "
DESCRIPTION = "Add dynamic filters to Narratives"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    # load from cache
    nar = internal_cache["narrative"]
    nar_type = internal_cache["type"]
    autocomplete = internal_cache["autocomplete"] or []

    dataset_slugs = list(set(utils.recursive_find(nar, DATASET_KEYS, False)))
    datasets = {d_slug: Dataset(mavis, DatasetManager(mavis=mavis)._slug_to_id(d_slug)) for d_slug in dataset_slugs}

    if not nar:
        schema = _object(dict(narrative_slug=_drop_down(_get_narrative(mavis), "slug", "name", title="Narrative")))
        schema_ui = dict(
            narrative_slug=_make_ui(options=dict(update_schema=True, process_data=True)),
        )

        return (schema, schema_ui)

    else:
        schema = _object(
            dict(
                header_text=_input(
                    default="\n".join(
                        [
                            "## Filter Configuration",
                            "Narrator allows you to define the columns you want to enable your users to filter using.",
                        ]
                    )
                ),
                dynamic_filters=_make_array(
                    dict(
                        label=_input("Name"),
                        type=_drop_down(
                            ["time_resolution", "current_user_email"] + ALL_TYPES,
                            default="timestamp",
                            title="Type",
                        ),
                    ),
                    default=_get_default_values(nar),
                    title="Define Dynamic Filter",
                ),
            )
        )

        filt_obj = schema["properties"]["dynamic_filters"]["items"]
        (all_cols, tree) = _get_all_columns(mavis, datasets, nar)

        # add conditions via type
        for v_type in ALL_TYPES:
            if v_type == "timestamp":
                user_value = "Within Range"
            elif v_type == "string":
                user_value = "Contains"
            elif v_type == "number":
                user_value = "Number Range"
            else:
                user_value = "Equals"

            # add the dependency
            _add_dependency(
                filt_obj,
                "type",
                v_type,
                dict(
                    filter_kind=_drop_down(
                        [
                            dict(kind="user_value", label=user_value),
                            dict(kind="list", label="Single Select"),
                            dict(
                                kind="list_w_default",
                                label="Single Select (Default to First)",
                            ),
                            dict(kind="multi_select", label="Multiple Select"),
                        ],
                        "kind",
                        "label",
                        default="user_value",
                        title="Kind",
                    ),
                    action=_drop_down(
                        [
                            "include",
                            "exclude",
                            "include_and_override",
                            "exclude_and_override",
                        ],
                        default="include",
                        title="Action",
                    ),
                    column_defs=_drop_down(
                        [c for c in all_cols if c["type"] == v_type],
                        "id",
                        "label",
                        is_multi=True,
                        title="Dataset Column",
                    ),
                ),
            )

        # DEAL with adding resolution
        _add_dependency(
            filt_obj,
            "type",
            "time_resolution",
            dict(
                current_value=_drop_down(RESOLUTIONS, default="month"),
                column_defs=_drop_down(
                    [c for c in all_cols if c.get("is_time_resolution")],
                    "id",
                    "label",
                    is_multi=True,
                    title="Dataset Column",
                ),
            ),
        )

        _add_dependency(
            filt_obj,
            "type",
            "current_user_email",
            dict(
                current_value=_drop_down(
                    [
                        u.email
                        for u in graph_client.get_all_users(company_id=mavis.company.id).user
                        if u.role != u.role.internal_admin
                    ],
                    default=mavis.user.email,
                ),
                column_defs=_drop_down(
                    [c for c in all_cols if c["type"] == "string"],
                    "id",
                    "label",
                    is_multi=True,
                    title="Dataset Column",
                ),
            ),
        )

        # Adding the actionablity for analyses
        if nar_type != "dashboard":
            schema["properties"].update(
                # Actionablity
                is_actionable=_input("Is Actionable", default=nar.get("is_actionable") or ""),
                actionable_value=_input("Actionable Value", default=nar.get("actionable_value") or ""),
                # plot slug
                takeway_plot=_drop_down(
                    _get_all_plots(nar, datasets),
                    title="Takeway Plot",
                    default=(json.dumps(nar["takeway_plot"]) if nar.get("takeway_plot") else None),
                ),
            )

            _hide_properties(
                schema,
                ["is_actionable", "actionable_value"],
                "add_actionablity",
                default=True if nar.get("is_actionable") else False,
            )

            _hide_properties(
                schema,
                ["takeway_plot"],
                "add_takeway_plot",
                default=True if nar.get("takeway_plot") else False,
            )

        # add the filters
        schema_ui = dict(
            **_make_ui(
                order=[
                    "header_text",
                    "dynamic_filters",
                    "add_actionablity",
                    "is_actionable",
                    "actionable_value",
                    "add_takeway_plot",
                    "takeway_plot",
                ]
            ),
            header_text=_make_ui(widget="MarkdownRenderWidget"),
            dynamic_filters=dict(
                **_make_ui(options=dict(title=False)),
                items=dict(
                    label=_make_ui(options=dict(**_space(25))),
                    type=_make_ui(options=dict(**_space(10))),
                    filter_kind=_make_ui(
                        options=dict(**_space(15)),
                        # info_modal=get_doc(mavis.company, "narrative/config/filter_kind"),
                    ),
                    action=_make_ui(
                        options=dict(**_space(15)),
                    ),
                    current_value=_make_ui(
                        options=dict(**_space(15)),
                    ),
                    column_defs=_make_ui(
                        widget="TreeSelectWidget",
                        options=dict(**_space(35), tree=tree),
                    ),
                ),
            ),
            add_actionablity=_make_ui(widget="BooleanToggleWidget", options=_space(mb=20)),
            is_actionable=_make_ui(
                widget="MarkdownWidget",
                options=dict(**_space(40, mb=20), autocomplete=autocomplete, default_height=50),
            ),
            actionable_value=_make_ui(
                widget="MarkdownWidget",
                options=dict(**_space(40, mb=20), autocomplete=autocomplete, default_height=50),
            ),
            add_takeway_plot=_make_ui(widget="BooleanToggleWidget", options=_space(mb=20)),
        )

        return (schema, schema_ui)


def _get_default_values(nar):
    ndf = nar.get("dynamic_filters") or []

    dynamic_filters = []

    seen = dict()
    for d in ndf:
        key = d["name"]

        if key not in seen.keys():
            seen[key] = len(dynamic_filters)
            dynamic_filters.append(
                dict(
                    label=d["label"],
                    type=d["type"],
                    filter_kind=d["kind"],
                    action=d.get("action") or "include",
                    current_value=d.get("current_value"),
                    column_defs=[],
                )
            )
        c = dict()
        # Copy the proper keys
        if d.get("section_id"):
            copy_keys = (
                "section_id",
                "content_id",
            )
        elif d.get("column_id"):
            copy_keys = (
                "dataset_slug",
                "group_slug",
                "column_id",
            )
        else:
            copy_keys = (
                "dataset_slug",
                "group_slug",
                "activity_column",
            )

        for k in copy_keys:
            c[k] = d.get(k)

        dynamic_filters[seen[key]]["column_defs"].append(json.dumps(c))
    return dynamic_filters


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["narrative"] = data["narrative"]
    internal["type"] = data["type"]

    # get the autocomplete for the plots
    if not internal["autocomplete"] and data["_raw_fields"]:
        internal["autocomplete"] = [
            fields_to_autocomplete(
                mavis,
                data["_raw_fields"],
                include_pretty=True,
            )
        ]

    return internal


def _get_all_columns(mavis, datasets, narrative):
    cols = []
    tree = []

    for d_slug, dataset in datasets.items():
        tree_branch = dict(
            value=d_slug,
            title=dataset.model.name,
            selectable=False,
            children=[],
        )

        # Adding prefilters
        tree_branch["children"].append(dict(value=f"{d_slug}._parent", title="PARENT", selectable=False, children=[]))
        child = tree_branch["children"][-1]["children"]
        parent_time_columns = []

        # if it is a time activity grab the first one
        if dataset.model.kind == DatasetKindEnum.time:
            c = dataset.model.columns[0]
            id = json.dumps(dict(dataset_slug=d_slug, group_slug="_parent", column_id=c.id))
            cols.append(
                dict(
                    id=id,
                    type=utils.get_simple_type(c.type),
                    label=f"{dataset.model.name}: PARENT - {c.label}",
                    column_id=c.id,
                    is_time_resolution=True,
                )
            )
            parent_time_columns.append(c.id)
            child.append(
                dict(
                    value=id,
                    title=c.label,
                )
            )

        # get the columns
        for c in dataset.model.output_columns:
            id = json.dumps(dict(dataset_slug=d_slug, group_slug="_parent", column_id=c.id))
            is_time_res = (
                any(r in (c.details.raw_str) for r in RESOLUTIONS)
                if c.details.kind == DetailKindEnum.computed
                else None
            )

            cols.append(
                dict(
                    id=id,
                    type=utils.get_simple_type(c.type),
                    label=f"{dataset.model.name}: PARENT - {c.label}",
                    column_id=c.id,
                    is_time_resolution=is_time_res,
                )
            )
            if is_time_res:
                parent_time_columns.append(c.id)

            child.append(
                dict(
                    value=id,
                    title=c.label,
                )
            )

        for g in dataset.model.all_tabs:
            # Add to each child
            tree_branch["children"].append(
                dict(
                    value=f"{d_slug}.{g.slug}",
                    label=g.label,
                    selectable=False,
                    children=[],
                )
            )
            child = tree_branch["children"][-1]["children"]
            for c in g.output_columns:
                id = json.dumps(
                    dict(
                        dataset_slug=d_slug,
                        group_slug=g.slug,
                        column_id=c.id,
                    )
                )
                cols.append(
                    dict(
                        id=id,
                        type=utils.get_simple_type(c.type),
                        is_time_resolution=(
                            (c.details.column_id in parent_time_columns)
                            if g.kind == TabKindEnum.group and c.details.kind == DetailKindEnum.group
                            else False
                        ),
                        label=f"{dataset.model.name}: {g.label} - {c.label}",
                    )
                )
                child.append(
                    dict(
                        value=id,
                        title=c.label,
                    )
                )

        # add all the prefilters
        for g in dataset.model.all_tabs:
            # Add the pre- filters
            tree_branch["children"].append(
                dict(
                    value=f"{d_slug}._prefilter.{g.slug}",
                    label=f"Pre-Filter of {g.label}",
                    selectable=False,
                    children=[],
                )
            )
            child = tree_branch["children"][-1]["children"]
            # Adding prefilters
            for c in dataset.model.columns:
                id = json.dumps(
                    dict(
                        dataset_slug=d_slug,
                        group_slug=f"_prefilter.{g.slug}",
                        column_id=c.id,
                    )
                )
                cols.append(
                    dict(
                        id=id,
                        type=c.type,
                        label=f"{dataset.model.name}: Pre-Filter of {g.label} - {c.label}",
                    )
                )
                child.append(
                    dict(
                        value=id,
                        title=c.label,
                    )
                )

        # for a in d_obj["activities"]:
        #     # define the activities
        #     if len(a["activity_ids"]) == 1 and utils.is_time(a["activity_ids"][0]):
        #         continue

        #     # Add the pre-filters for the activities
        #     tree_branch["children"].append(
        #         dict(
        #             value=f'{d_slug}._edit.{a["id"]}',
        #             label=f'{a["name"]} {a["relationship_slug"] if a["kind"] == "append" else "cohort"}',
        #             selectable=False,
        #             children=[],
        #         )
        #     )
        #     child = tree_branch["children"][-1]["children"]

        #     activity_ids = a["activity_ids"]
        #     # handle missing activities
        #     try:
        #         all_cols = get_activity_columns(
        #             mavis, activity_ids, include_customer=True, include_values=False
        #         )["all_columns"]
        #     except SilenceError:
        #         continue

        #     # Adding prefilters
        #     for c in all_cols:
        #         id = json.dumps(
        #             dict(
        #                 dataset_slug=d_slug,
        #                 group_slug=f'_edit.{a["id"]}',
        #                 activity_column=c,
        #             )
        #         )
        #         cols.append(
        #             dict(
        #                 id=id,
        #                 type=utils.get_simple_type(c.type),
        #                 label=f'{d_obj.get("name")}: {a["name"]} {a["relationship_slug"] if a["kind"] == "append" else "cohort"} - {c.label}',
        #             )
        #         )
        #         child.append(
        #             dict(
        #                 value=id,
        #                 title=c.label,
        #             )
        #         )

        tree.append(tree_branch)

    # add all the fields from the Narrative
    for s in narrative["narrative"]["sections"]:
        # create a tree branch
        tree_branch = dict(
            value=s["id"],
            label=f'Section: {s["title"]}',
            selectable=False,
            children=[],
        )
        children = tree_branch["children"]

        # Gre
        for c in s["content"]:
            id = json.dumps(dict(section_id=s["id"], content_id=c.get("id")))
            f'content.{s["id"]}.{c["id"]}'

            if c["type"] == "markdown":
                title = f'Markdown: {c["text"][:30]}...'
            elif (
                c["type"] == "metric_v2"
                and utils.limit_dict(c["data"], ("filters", "compare_filters"))
                and datasets.get(c["data"]["dataset_slug"])
            ):
                all_cols = datasets[c["data"]["dataset_slug"]].model.get_ui(c["data"]["group_slug"]).output_columns

                col = next((cc for cc in all_cols if cc.id == c["data"]["column_id"]), None)

                if not col:
                    continue

                # then add the label
                title = f"Metric: {col.label} Filters"
            else:
                continue

            children.append(
                dict(
                    value=id,
                    title=title,
                )
            )
            cols.append(
                dict(
                    id=id,
                    type=None,
                    label=title,
                    is_time_resolution=True,
                )
            )

        tree.append(tree_branch)

    return (cols, tree)


def _get_all_plots(nar, datasets):
    return []


@tracer.start_as_current_span("get_values")
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    values = []
    return dict(values=values)


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    if update_field_slug == "root_narrative_slug":
        narrative_updator = NarrativeUpdator(mavis=mavis)
        narrative_id = narrative_updator._slug_to_id(data["narrative_slug"])
        data["narrative"] = narrative_updator.get_config(narrative_id)

    return data


def run_data(mavis: Mavis, data: dict):
    nar = data["narrative"]

    all_names = []
    for f in nar["field_configs"]:
        all_names.extend(_get_all_names(f))

    nar["dynamic_filters"] = ndf = []

    for d in data["dynamic_filters"]:
        for c in d["column_defs"]:
            col = json.loads(c)
            # if utils.slugify(d["label"]) in all_names:
            #     raise SilenceError(
            #         f'The name {d["label"]} is already used as a variable in this {data["type"]}. Please rename it.'
            #     )

            ndf.append(
                dict(
                    # this is for the Narrative
                    section_id=col.get("section_id"),
                    content_id=col.get("content_id"),
                    # this if for Filter
                    dataset_slug=col.get("dataset_slug"),
                    group_slug=col.get("group_slug"),
                    column_id=col.get("column_id"),
                    activity_column=col.get("activity_column"),
                    # Add the def
                    label=d["label"],
                    name=utils.slugify(d["label"]),
                    current_value=d["current_value"],
                    kind=d["filter_kind"],
                    action=d["action"],
                    type=d["type"],
                )
            )

    if data["is_actionable"]:
        nar["is_actionable"] = data["is_actionable"] or None
        nar["actionable_value"] = data["actionable_value"] or None

    if data["takeway_plot"]:
        nar["takeway_plot"] = json.loads(data["takeway_plot"])

    # upload the narrative
    if data["narrative_slug"]:
        NarrativeUpdator(mavis=mavis).update_config(data["narrative_slug"], nar)

    return [dict(type="json", value=nar)]
