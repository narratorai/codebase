from collections import defaultdict

from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.graph import graph_client
from core.models.internal_link import PORTAL_URL
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_array,
    _make_ui,
    _space,
)
from core.v4.blocks.transformation_context_v2 import (
    __load_default_scratchpad,
    _save_query,
    async_push_to_production,
)
from core.v4.mavis import Mavis

TITLE = "Query Template Applier"
DESCRIPTION = "This allows you create transformations using the query templates."
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    warehouse_language = mavis.company.warehouse_language
    warehouse_schema = WarehouseManager(mavis=mavis).get_schema()

    query_templates = graph_client.get_query_templates(warehouse_language=warehouse_language).query_templates
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            el_source=_drop_down(
                list(set(q.el_source for q in query_templates)),
                default="fivetran",
                title="El Source",
            ),
            create_options=_make_array(
                dict(
                    header=_input(),
                    data_source=_drop_down(
                        list(set(q.data_source for q in query_templates)),
                        title="Matched Data Source",
                    ),
                    table_name=_input("Table Name", default="customer_stream"),
                    schema_option=_drop_down(warehouse_schema.schemas, title="Matched Schema"),
                    transformations=_drop_down(
                        [dict(id=q.id, name=q.transformation_name) for q in query_templates],
                        "id",
                        "name",
                        is_multi=True,
                        title="",
                    ),
                ),
                title="Available Templates",
            ),
            test_and_deploy=_checkbox("Test and Deploy (if validates) in the background", default=True),
        ),
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
                process_data_on_load=True,
            ),
            order=["el_source", "create_options", "test_and_deploy"],
        ),
        el_source=_make_ui(options=dict(**_space(50))),
        create_options=dict(
            **_make_ui(
                options=dict(
                    addable=True,
                    orderable=False,
                    removable=True,
                )
            ),
            items=dict(
                **_make_ui(
                    order=[
                        "header",
                        "data_source",
                        "schema_option",
                        "table_name",
                        "transformations",
                    ],
                ),
                header=_make_ui(widget="MarkdownRenderWidget"),
                data_source=_make_ui(options=dict(**_space(30))),
                schema_option=_make_ui(options=dict(**_space(30))),
                table_name=_make_ui(options=dict(allows_new_items=True, **_space(40))),
                transformations=_make_ui(options=dict(load_values=True)),
            ),
        ),
    )
    return schema, schema_ui


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    warehouse_language = mavis.company.warehouse_language
    query_templates = graph_client.get_query_templates(warehouse_language=warehouse_language).query_templates

    # filter for the right opotions
    query_templates = [q for q in query_templates if q.el_source == (data["el_source"] or "fivetran")]

    all_schemas = WarehouseManager(mavis=mavis).get_schema()
    opts = defaultdict(list)

    activity_table = mavis.company.tables[0].activity_stream if mavis.company.tables else "activity_stream"

    for q in query_templates:
        is_activity = "enriched_activity_id" not in q.query.lower()
        valid_schemas = (q.schema_names or "").split(",")
        for s in all_schemas.schemas:
            if _check_schema_match(s, valid_schemas):
                table_name = activity_table if is_activity else utils.slugify(q.transformation_name)
                # add the object
                opts[(q.data_source, s, table_name)].append(q.id)
                break

    data["create_options"] = []
    for k, v in opts.items():
        data["create_options"].append(
            dict(
                data_source=k[0],
                schema_option=k[1],
                table_name=k[2],
                transformations=v,
            )
        )

    return data


def _check_schema_match(schema, valid_schemas):
    schema = schema.lower().split(".")[-1]
    for v in valid_schemas:
        if v.lower() == schema.lower():
            return True
        elif v.endswith("*") and schema.startswith(v[:-1]):
            return True
        elif v.startswith("*") and schema.endswith(v[1:]):
            return True
    return False


def get_values(mavis: Mavis, data, updated_field_slug: str):
    values = []
    if updated_field_slug.endswith("transformations"):
        # get all the templates
        warehouse_language = mavis.company.warehouse_language
        query_templates = graph_client.get_query_templates(warehouse_language=warehouse_language).query_templates

        ii = int(updated_field_slug.split("_")[-2])
        el_source = data["el_source"]
        values = [
            dict(value=q.id, label=q.transformation_name)
            for q in query_templates
            if q.el_source == el_source and q.data_source == data["create_options"][ii]["data_source"]
        ]

    return dict(values=values)


def run_data(mavis: Mavis, data: dict):
    content = []

    all_trans = graph_client.get_all_transformations(mavis.company.id, limit=1000, offset=0).transformations
    tarns_mapping = {t.current_query.sql: t.id for t in all_trans}

    warehouse_language = mavis.company.warehouse_language
    all_query_templates = graph_client.get_query_templates(warehouse_language=warehouse_language).query_templates
    query_templates = {q.id: q for q in all_query_templates}

    for each_option in data["create_options"]:
        content.append("## {} Transformations".format(each_option["data_source"]))

        for trans in each_option["transformations"]:
            kind = query_templates[trans].transformation_kind
            update_type = query_templates[trans].transformation_update_type
            query = query_templates[trans].query.replace("{schema}", each_option["schema_option"])

            # get the id if we already have the transformation
            transformation_id = tarns_mapping.get(query, None)

            obj = dict(
                current_script=dict(
                    name=query_templates[trans].transformation_name,
                    kind=kind,
                    current_query_scratchpad=dict(
                        current_query=dict(sql=query),
                        scratchpad=dict(notes=__load_default_scratchpad(kind)),
                    ),
                    table_name=each_option["table_name"],
                ),
                process_configuration=dict(update_type=update_type),
            )
            _save_query(mavis, obj, transformation_id)

            # this will test and deploy all the transformations
            if data["test_and_deploy"]:
                async_push_to_production.send(
                    mavis.company.slug,
                    data["current_script"]["id"],
                    mavis.user.id,
                )

            content.append(
                " - Synced {name}: {portal}/{company_slug}/transformations/edit/{transform_id}".format(
                    portal=PORTAL_URL,
                    company_slug=mavis.company.slug,
                    name=obj["current_script"]["name"],
                    transform_id=obj["current_script"]["id"],
                )
            )

    return [dict(type="markdown", value="\n".join(content))]
