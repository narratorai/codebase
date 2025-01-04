import re

from core import utils
from core.errors import SilenceError
from core.graph import graph_client
from core.models.ids import get_uuid
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _space,
)
from core.v4.blocks.transformation_context_v2 import KINDS, TYPE_RENAMES
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import CONFIG

TITLE = "Query Template Creator"
DESCRIPTION = "This allows you create or update the queries from the query builder."
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    query_templates = graph_client.get_query_template_sources().query_templates

    all_transformations = [
        dict(id=t.id, label=t.name)
        for t in graph_client.transformation_index(company_id=mavis.company.id).all_transformations
    ]

    data_source = list(set(q.data_source for q in query_templates))

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            data_source=_drop_down(data_source, default=data_source[0], title="Data Source"),
            schema_names=_drop_down([], is_multi=True, title="Schemas names", default=[]),
            transformation_name=_drop_down([], title="Template Transformation Name"),
            transformation_kind=_drop_down(KINDS, "slug", "name", title="Transformation Kind", default="stream"),
            save=_checkbox("Save"),
            transformation_update_type=_drop_down(
                [dict(slug=k, name=v) for k, v in TYPE_RENAMES.items()],
                "slug",
                "name",
                title="Transformation Update Type",
                default="regular",
            ),
            copy_from=_drop_down(all_transformations, "id", "label", title="Copy From"),
            queries=_make_array(
                dict(
                    name=_input("Name"),
                    warehouse_language=_drop_down(
                        list(CONFIG.keys()),
                        default=mavis.company.warehouse_language,
                        title="Warehouse Language",
                    ),
                    sql=_input("Query", default="SELECT \n\t*\nFROM"),
                )
            ),
        ),
    )
    # hide properties
    _hide_properties(
        schema,
        ["copy_from"],
        "copy_query",
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_submit=True,
                hide_output=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            ),
            order=[
                "data_source",
                "schema_names",
                "save",
                "transformation_name",
                "transformation_kind",
                "transformation_update_type",
                "copy_query",
                "copy_from",
                "copy_to_warehouse",
                "queries",
            ],
        ),
        data_source=_make_ui(options=dict(allows_new_items=True, process_data=True, **_space(30))),
        schema_names=_make_ui(
            options=dict(
                allows_new_items=True,
                **_space(40),
            )
        ),
        save=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="primary",
                **_space(30, align_right=True),
            ),
        ),
        transformation_name=_make_ui(
            options=dict(
                size="large",
                load_values=True,
                process_data=True,
                allows_new_items=True,
                **_space(50),
            )
        ),
        transformation_kind=_make_ui(
            options=dict(
                **_space(25),
            )
        ),
        transformation_update_type=_make_ui(
            options=dict(
                **_space(25),
            )
        ),
        delete=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                **_space(10, inline_button=True),
                process_data=True,
                button_type="secondary",
                danger=True,
                tiny=True,
                popconfirm=True,
                popconfirm_text="Are you sure you want to delete the template?",
            ),
        ),
        queries=dict(
            items=dict(
                **_make_ui(
                    order=["warehouse_language", "name", "sql"],
                ),
                name=_make_ui(
                    options=dict(
                        **_space(70),
                    ),
                    disabled=True,
                ),
                warehouse_language=_make_ui(
                    options=dict(
                        **_space(30),
                    )
                ),
                sql=_make_ui(
                    widget="SqlWithTableWidget",
                ),
            ),
        ),
        copy_query=_make_ui(widget="BooleanToggleWidget"),
        copy_from=_make_ui(
            options=dict(
                process_data=True,
                **_space(40),
            )
        ),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["warehouse_language"] = data["warehouse_language"]
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    query_templates = graph_client.get_query_templates_for_source(data_source=data["data_source"]).query_template

    if update_field_slug == "root_data_source":
        schema_names = []
        for t in query_templates:
            schema_names.extend((t.schema_names or "").split(","))

        data["schema_names"] = list(set(schema_names))
        data["transformation_name"] = None
        data["queries"] = []

    elif update_field_slug == "root_delete":
        for q in data["queries"]:
            if q["id"]:
                graph_client.delete_query_template(id=q["id"])

    elif update_field_slug == "root_transformation_name":
        all_queries = [
            t for t in query_templates if t.transformation_name.split("||")[0] == data["transformation_name"]
        ]
        data["queries"] = []
        for q in all_queries:
            data["queries"].append(
                dict(
                    id=q.id,
                    name=(
                        q.transformation_name.split("||")[1]
                        if len(q.transformation_name.split("||")) > 1
                        else "Original"
                    ),
                    warehouse_language=q.warehouse_language,
                    sql=q.query,
                )
            )

    elif update_field_slug == "root_save":
        all_queries = [
            t for t in query_templates if t.transformation_name.split("||")[0] == data["transformation_name"]
        ]

        for q in all_queries:
            if q.id not in (q["id"] for q in data["queries"]):
                graph_client.delete_query_template(id=q.id)

        for q in data["queries"]:
            # remove the sql
            for schema in data["schema_names"]:
                pattern = re.compile(" " + schema + ".", re.IGNORECASE)
                q["sql"] = pattern.sub(" {schema}.", q["sql"])
            try:
                if q["id"]:
                    graph_client.update_query_template(
                        id=q["id"],
                        data_source=data["data_source"],
                        schema_names=",".join(data["schema_names"] or []).lower(),
                        sql_query=q["sql"],
                        transformation_kind=data["transformation_kind"],
                        transformation_update_type=data["transformation_update_type"],
                        updated_by=mavis.user.id,
                    )
                else:
                    name = data["transformation_name"]
                    if q["warehouse_language"] in [tq["warehouse_language"] for tq in data["queries"] if tq.get("id")]:
                        name += f"|| {get_uuid()[:4]}"

                    q = graph_client.insert_query_template(
                        warehouse_language=q["warehouse_language"],
                        data_source=data["data_source"],
                        transformation_name=name,
                        transformation_kind=data["transformation_kind"],
                        transformation_update_type=data["transformation_update_type"],
                        schema_names=",".join(data["schema_names"] or []).lower(),
                        sql_query=q["sql"],
                        updated_by=mavis.user.id,
                    )
                    data["id"] = q.inserted_template.id
            except Exception as e:
                raise SilenceError(f"There was an error updating the query template: {utils.get_error_message(e)}")

        # saved the notification
        data["_notification"] = utils.Notification(message="SAVED!", type=utils.NotificationTypeEnum.SUCCESS)

    elif update_field_slug == "root_copy_from":
        trans = graph_client.get_transformation_simple(id=data["copy_from"]).transformation

        if not data["transformation_name"]:
            data["transformation_name"] = trans.name
            data["transformation_kind"] = trans.kind.value
            data["transformation_update_type"] = trans.update_type.value

        data["queries"] = data["queries"] or []
        data["queries"].append(dict(sql=trans.current_query.sql, name=""))

    return data


def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    values = []

    if updated_field_slug == "root_transformation_name":
        query_templates = graph_client.get_query_templates_for_source(data_source=data["data_source"]).query_template

        all_vals = [t.transformation_name.split("||")[0] for t in query_templates]
        values = [dict(value=t, label=t) for t in set(all_vals)]

    return dict(values=values)


def run_data(mavis: Mavis, data: dict):
    return []
