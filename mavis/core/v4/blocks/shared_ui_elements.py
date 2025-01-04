from core import utils
from core.api.customer_facing.datasets.utils import DatasetQueryBuilder
from core.api.customer_facing.sql.utils import WarehouseManager
from core.errors import SilenceError
from core.graph import graph_client, make_sync_client
from core.models.ids import is_valid_uuid
from core.v4.analysisGenerator import fields_to_autocomplete
from core.v4.mavis import Mavis

SUPPORTED_WIDGETS = [
    "SqlWithTableWidget",
    "SqlWidget",
    "MarkdownWidget",
    "MarkdownRenderWidget",
    "BooleanToggleWidget",
    "BooleanButtonWidget",
    "textarea",
    "color",
]

# TODO: make this a model
# "hide_submit": true,
# "hide_output": true
# button type: primary ghost dashed link text default
# danger: True/False
# from shared_ui_elements import _make_ui, _make_array, _hide_properties, _who_when, _date_picker, _checkbox, _input, _drop_down, _object, _add_dependency, _space, _number


def _make_ui(**kwargs):
    obj = {}

    for k, v in kwargs.items():
        if v is not None:
            obj[f"ui:{k}"] = v

    if kwargs.get("hidden"):
        obj["ui:widget"] = "hidden"
    if kwargs.get("help_text"):
        obj["ui:help"] = kwargs["help_text"]
    if kwargs.get("disabled_fields"):
        obj["ui:enumDisabled"] = kwargs["disabled_fields"]

    return obj


def _space(
    width=100,
    pr=12,
    pl=0,
    inner_width=None,
    add_line=False,
    mb=8,
    my=None,
    inline_button=False,
    align_right=False,
    is_steps=False,
    outer_box_props=None,
    inner_box_props=None,
):
    space = dict(
        outer_box_props=dict(width=f"{width}%", pr=f"{pr}px", pl=f"{pl}px"),
        bottom_border=add_line,
    )
    if inner_width:
        space["inner_box_props"] = dict(width=f"{inner_width}%")

    if inline_button:
        space["inline_input_height"] = True

    if mb:
        space["outer_box_props"]["mb"] = f"{mb}px"

    if my:
        space["outer_box_props"]["my"] = f"{my}px"

    if align_right:
        space["button_wrapper_style"] = dict(float="right", marginTop="25px")
        space["outer_box_props"]["pr"] = "0px"

    if is_steps:
        space["outer_box_props"] = dict(width="100%")
        space["step_box_props"] = dict(p=3, mt=3, mb=-1)  # , bg="gray100")
        space["step_button_flex_props"] = dict(justify_content="center")

    if outer_box_props:
        space["outer_box_props"] = outer_box_props

    if inner_box_props:
        space["inner_box_props"] = inner_box_props

    return space


def _add_dependency(obj, key, value, new_object, required=None):
    required = required or []

    if "dependencies" not in obj.keys():
        obj["dependencies"] = {}

    if key not in obj["dependencies"].keys():
        obj["dependencies"][key] = dict(oneOf=[])

    # add the dependency
    obj["dependencies"][key]["oneOf"].append(
        dict(
            properties={
                key: dict(enum=value if isinstance(value, list) else [value]),
                **new_object,
            },
            required=required,
        )
    )
    return obj["dependencies"][key]["oneOf"][-1]


def _get_dataset(mavis: Mavis, shared_first=False):
    results = DatasetQueryBuilder(per_page=200, user=mavis.user).get_results()
    all_datasets = [
        dict(
            id=d["id"],
            slug=d["slug"],
            name=d["name"],
            status="live",
            viewed_at=d["last_viewed_at"],
        )
        for d in results["data"]
    ]

    return all_datasets


def _get_narrative(mavis: Mavis):
    narratives = make_sync_client(mavis.user.token).ordered_narrative_index(company_id=mavis.company.id).narrative
    all_narratives = [
        dict(
            id=narrative.id,
            slug=narrative.slug,
            name=narrative.name,
            viewed_at=narrative.updated_at,
        )
        for narrative in narratives
    ]

    return sorted(all_narratives, key=lambda v: v["viewed_at"], reverse=True)


def _get_config(data, file_name):
    if data.get("version"):
        data = dict(
            left=data,
            right={},
            **{k: v for k, v in data.items() if k.startswith("_")},
        )

    config = data["left"]

    config["version"] = "v2"
    # kind is used as block_slug
    config["kind"] = file_name
    config["block"] = file_name

    return (config, data)


# def _process_column_mapping(mavis: Mavis, config, local_cache=None):
#     # return the data
#     cols = config.get("column_mapping") or {}

#     # check and define the cache
#     local_cache = _get_cache(local_cache)

#     # get the dataset from cache
#     d_obj = _fetch_dataset(mavis, local_cache, config["dataset_slug"])

#     # get the query
#     query_obj = DatasetUpdator(mavis=mavis).get_config_query(d_obj)
#     temp_cols = dataset.ds.get_all_columns(
#         query_obj, group_slug=config["group_slug"], force_uniqueness=True
#     )
#     for c in temp_cols:
#         cols[dataset.ds.column_mapper[c["id"]]] = c["id"]

#     config["column_mapping"] = cols


def _get_dim_id(mavis: Mavis, selected_table, join_key, require_join_key=False):
    if not selected_table:
        return None
    elif is_valid_uuid(selected_table):
        return selected_table
    elif require_join_key and not join_key:
        raise SilenceError("Please choose a join key to be used in the query")
    else:
        return WarehouseManager(mavis=mavis).convert_to_dim(selected_table, join_key)


def _user_drop_down(mavis: Mavis, title=None, is_multi=False):
    users = [
        dict(
            id=u.user_id,
            label=f"{u.first_name} ({u.user.email})" if u.first_name else u.user.email,
        )
        for u in graph_client.get_company_users(company_id=mavis.company.id).company_user
    ]
    return _drop_down(users, "id", "label", is_multi=is_multi, default=[mavis.user.id], title=title)


def _get_all_tables(mavis: Mavis, show_key=False):
    warehouse_schema = mavis.company.warehouse_schema

    warehouse_tables = WarehouseManager(mavis=mavis).get_schema()
    all_tables = []
    for t in warehouse_tables.tables:
        if t.dim_id is not None:
            obj = dict(id=t.dim_id, label=f"Dim: {t.name}")
        else:
            obj = dict(id=t.id, label=t.name)

        if any(t.lower_name.lower().startswith(c.activity_stream) for c in mavis.company.tables):
            continue

        if t.schema_name.lower().split(".")[-1] == warehouse_schema:
            if not (t.lower_name.startswith("stg__")):
                all_tables.insert(0, obj)
        else:
            all_tables.append(obj)
    return all_tables


def _get_all_columns(mavis: Mavis, id):
    if id is None:
        all_cols = []
    elif utils.is_time(id):
        all_cols = []
    else:
        table = WarehouseManager(mavis=mavis).get_table(id)
        all_cols = [dict(value=c.name, label=c.name) for c in table.columns]

    return all_cols


def _get_col_weight(c):
    for ii, k in enumerate(["id", "customer"]):
        if k == c:
            return ii
        elif c["name"].startswith(k) or c["name"].endswith(k):
            return ii + 0.5

    return ii + 1


# def _add_old_columns(config, fields, name):
#     # map the columns to make it easier to use
#     cm_id = {c["id"]: c["label"] for c in cm}

#     # map all the columns to all the old names that we had
#     for old_name, col_id in (config.get("column_mapper") or dict()).items():
#         if f"{name}_{old_name}" not in fields.keys() and cm_id.get(col_id):
#             fields[f"{name}_{old_name}"] = fields[f"{name}_{cm_id[col_id]}"]


def _basic_field_block(
    main_obj,
    main_ui,
    override_content=None,
    make_dynamic=False,
    fields=None,
    hide_format=False,
):
    default_content = _create_content("See the value of the data", "Learn some helpful ways to use this variable")

    # create the schema
    schema = _object(
        dict(
            left=_object(
                dict(
                    value=main_obj if main_obj.get("properties") else _object(main_obj),
                    name=_input("variable Name"),
                    format=_drop_down(
                        [f for f in utils.HUMAN_FORMATS if f["id"] not in ("time", "table")],
                        "id",
                        "label",
                        default="text",
                        title="Format",
                    ),
                    explanation=_input("explanation"),
                    dynamic_type=_drop_down(
                        [
                            "free_text",
                            "date",
                            "number",
                            "percent",
                            "revenue",
                            "table_variable",
                            "table_variable_multi",
                        ],
                        title="Filter Type",
                    ),
                )
            ),
            right=_object(
                dict(
                    run=_checkbox("Run ▷"),
                    save=_checkbox("Save"),
                    content=_input(default=override_content or default_content),
                )
            ),
        )
    )

    _hide_properties(schema["properties"]["left"], "explanation", "add_explanation")

    if make_dynamic:
        _add_dependency(
            schema["properties"]["left"],
            "dynamic_type",
            "list",
            dict(dynamic_options=_drop_down([], is_multi=True)),
        )

        field_options = []

        for k, v in (fields or {}).items():
            if k[0] not in ("#", "_") and isinstance(v, list):
                field_options.append(
                    dict(
                        id=f"{{{k}}}",
                        label=k,
                    )
                )

        _add_dependency(
            schema["properties"]["left"],
            "dynamic_type",
            "table_variable",
            dict(dynamic_options=_drop_down(field_options, "id", "label")),
        )

    _hide_properties(
        schema["properties"]["left"],
        ["dynamic_type", "dynamic_options"],
        "set_as_user_input",
    )

    # Add the headers
    main_ui.update(**_make_ui(options=dict(hide_output=True, title=False, flex_direction="row", flex_wrap="wrap")))

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_output=True,
                hide_submit=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            )
        ),
        left=dict(
            **_make_ui(
                options=dict(
                    hide_output=True,
                    title=False,
                    flex_direction="row",
                    flex_wrap="wrap",
                    **_space(50, pr=20),
                ),
                order=[
                    "value",
                    "name",
                    "format",
                    "add_explanation",
                    "explanation",
                    "set_as_user_input",
                    "dynamic_type",
                    "dynamic_options",
                ],
            ),
            value=main_ui,
            name=_make_ui(options=_space(70 if not hide_format else 100)),
            format=_make_ui(hidden=hide_format, options=_space(30)),
            add_explanation=_make_ui(widget="BooleanToggleWidget"),
            set_as_user_input=_make_ui(hidden=not make_dynamic),
            dynamic_type=_make_ui(hidden=not make_dynamic, options=_space(30)),
            dynamic_options=_make_ui(
                hidden=not make_dynamic,
                options=dict(allows_new_items=True, **_space(70)),
            ),
        ),
        right=dict(
            **_make_ui(
                options=dict(
                    hide_output=True,
                    title=False,
                    flex_direction="row",
                    flex_wrap="wrap",
                    **_space(50, pl=20),
                ),
                order=["run", "save", "content"],
            ),
            run=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    process_data=True,
                    button_type="secondary",
                    **_space(45, inline_button=True),
                ),
            ),
            save=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    button_type="primary",
                    submit_form=True,
                    **_space(
                        50,
                        align_right=True,
                    ),
                ),
            ),
            content=_make_ui(widget="MarkdownRenderWidget"),
        ),
    )
    return (schema, schema_ui)


def _clean_name(name, fields):
    name = utils.slugify(name)

    # override variable name cause we cannot start with number
    if name[0].isdigit():
        name = "v_" + name

    # fix the input names (or is a default field)
    if name not in fields.keys() or name in fields.get("_default_fields", []):
        return name

    np = name.split("_")
    while name in fields.keys():
        if np[-1].isdigit():
            np[-1] = str(int(np[-1]) + 1)
            name = "_".join(np)
        else:
            name += "_1"
    return name


def _create_autocomplete(mavis, raw_fields):
    if raw_fields:
        return [
            fields_to_autocomplete(
                mavis,
                raw_fields,
                include_pretty=False,
            )
        ]
    return []


def _create_content(preview, tips):
    return "\n\n".join(
        [
            "<br>",
            "## Preview the variable output",
            preview,
            "-----",
            "## Some Helpful Tips",
            tips,
        ]
    )


def _table(**kwargs):
    return dict(
        type="object",
        properties=dict(
            columns=_make_array(
                obj=dict(
                    title=_input(),
                    data_index=_input(),
                )
            ),
            rows=_make_array(),
        ),
        **kwargs,
    )


def _object(obj=None, **kwargs):
    if obj:
        return dict(type="object", properties=obj, **kwargs)
    else:
        return dict(type="object", **kwargs)


def _drop_down(
    obj=None,
    slug_key=None,
    name_key=None,
    graph_enum=None,
    is_multi=False,
    is_examples=False,
    **kwargs,
):
    if graph_enum:
        obj = [
            v["value"]
            for v in graph_client.execute(
                f"""query GetEnums {{
                {graph_enum} {{
                    value
                }}
            }}"""
            ).json()["data"][graph_enum]
        ]

    if slug_key:
        drop_down = dict(
            enum=[d[slug_key] for d in obj],
            enumNames=[(d[name_key] if name_key else utils.title(d[slug_key])) for d in obj],
            type="string",
        )
    elif is_examples:
        drop_down = dict(type="string", examples=obj)
    else:
        drop_down = dict(enum=obj, enumNames=[utils.title(d) for d in obj], type="string")

    if is_multi:
        drop_down = dict(type="array", default=[], items=drop_down, uniqueItems=True)

    drop_down.update(**kwargs)
    return drop_down


def _advanced_drop_down(obj, is_multi=False, **kwargs):
    drop_down = dict(enumOptions=obj, type="string")

    if is_multi:
        drop_down = dict(type="array", items=drop_down, uniqueItems=True)

    drop_down.update(**kwargs)
    return drop_down


def _input(title=" ", **kwargs):
    return dict(type="string", title=title, **kwargs)


def _number(title=" ", **kwargs):
    return dict(type="number", title=title, **kwargs)


def _checkbox(title=" ", **kwargs):
    return dict(type="boolean", title=title, **kwargs)


def _date_picker(title, include_time=False, **kwargs):
    return dict(
        type="string",
        format="date-time" if include_time else "date",
        title=title,
        **kwargs,
    )


def _who_when(who, when, prefix="updated", tz="UTC"):
    return "{prefix} By: {who} @ {when}".format(prefix=prefix, who=who, when=utils.human_format(when, "time", tz))


def _hide_properties(
    schema,
    property_list,
    flag_name,
    false_property_list=None,
    default=False,
    override_name=None,
):
    property_object = {k: v for k, v in schema["properties"].items() if k in property_list}
    required = [r for r in (schema.get("required") or []) if r in property_list]

    if false_property_list:
        false_property = {k: v for k, v in schema["properties"].items() if k in false_property_list}
    else:
        false_property = {}

    # remove keys
    for k in property_object:
        del schema["properties"][k]

    for k in false_property:
        del schema["properties"][k]

    # create a flag
    default_title = utils.title(flag_name)
    schema["properties"][flag_name] = dict(type="boolean", default=default, title=override_name or default_title)

    _add_dependency(schema, flag_name, True, property_object, required=required)
    _add_dependency(schema, flag_name, False, false_property)


def _move_dependency(schema, key, value, property_list):
    property_object = {k: v for k, v in schema["properties"].items() if k in property_list}
    required = [r for r in (schema.get("required") or []) if r in property_list]

    # delete them from the schema
    for k in property_object:
        del schema["properties"][k]

    if "dependencies" not in schema.keys():
        schema["dependencies"] = dict()

    if key not in schema["dependencies"].keys():
        schema["dependencies"][key] = dict(oneOf=[])

    # add the dependency
    schema["dependencies"][key]["oneOf"].append(
        dict(
            properties={
                key: dict(enum=value if isinstance(value, list) else [value]),
                **property_object,
            },
            required=required,
        )
    )
    return schema["dependencies"][key]["oneOf"][-1]


def _make_array(obj=None, any_of=None, **kwargs):
    if obj and not any_of:
        new_obj = dict(type="array", items=dict(type="object", properties=obj), **kwargs)
    elif any_of and not obj:
        new_obj = dict(type="array", items=dict(type="object", anyOf=any_of), **kwargs)
    elif obj and any_of:
        new_obj = dict(
            type="array",
            items=dict(type="object", properties=obj, anyOf=any_of),
            **kwargs,
        )
    else:
        new_obj = dict(
            type="array",
            items=dict(type="object"),
            **kwargs,
        )
    return new_obj


def _make_steps(
    name="step_flow",
    kind="default",
    default=None,
    clickable=False,
    next_button_label="Next",
    back_button_label="Back",
):
    schema = _object(
        dict(
            field_slug=_input(default=name),
            type=_input(default=kind),  # can also be navigation
            size=_input(default="small"),
            clickable=_checkbox(default=clickable),
            current=_number(default=0),
            show_buttons=_checkbox(default=True),
            button_labels=_object(
                dict(
                    next=_input(default=next_button_label),
                    previous=_input(default=back_button_label),
                )
            ),
            steps=_make_array(
                dict(
                    title=_input(),
                    description=_input(),
                    sub_title=_input(),
                    status=_input(),
                    disabled=_checkbox(),
                ),
                default=default,
            ),
        )
    )

    return schema
