import json

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.graph import graph_client
from core.models.internal_link import PORTAL_URL
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_ui,
    _space,
)
from core.v4.blocks.transformation_context_v2 import __transformation_to_data
from core.v4.mavis import Mavis

TITLE = "Batch Export"
DESCRIPTION = "This allows you batch export Transformations and Datasets so you can import them into another company"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    # load from cache
    all_datasets = [
        dict(id=d.id, name=d.name)
        for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
        if d.status == d.status.live or d.created_by == mavis.user.id
    ]

    all_transformations = [
        dict(id=d.id, name=d.name)
        for d in graph_client.transformation_index(company_id=mavis.company.id).all_transformations
    ]
    if mavis.user.is_internal_admin:
        all_companies = [dict(id=c.id, name=c.name) for c in graph_client.get_all_companies().company]

    else:
        all_companies = [
            dict(id=d.company_id, name=d.company.name)
            for d in graph_client.get_all_companies_for_admin_user(user_id=mavis.user.id).company_user
        ]

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            transformations=_drop_down(
                all_transformations,
                "id",
                "name",
                is_multi=True,
                title="transformations",
            ),
            all_trans=_checkbox("Select All"),
            datasets=_drop_down(all_datasets, "id", "name", is_multi=True, title="Datasets"),
            all_dataset=_checkbox("Select All"),
            company_id=_drop_down(all_companies, "id", "name", title="Copy To Company"),
            create_export=_checkbox("Create Export"),
            export_data=_input(),
            context=_input(),
        ),
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
        ),
        transformations=_make_ui(options=dict(data_public=True, **_space(70))),
        all_trans=_make_ui(options=dict(process_data=True, **_space(30, inline_button=True))),
        datasets=_make_ui(options=dict(data_public=True, **_space(70))),
        all_dataset=_make_ui(options=dict(process_data=True, **_space(30, inline_button=True))),
        create_export=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                button_type="primary",
                process_data=True,
                **_space(30, inline_button=True),
            ),
        ),
        export_data=_make_ui(widget="MarkdownWidget", options=dict(default_height=120)),
        context=_make_ui(widget="MarkdownRenderWidget"),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    if update_field_slug == "root_all_trans":
        if data["all_trans"]:
            data["transformations"] = [
                d.id for d in graph_client.transformation_index(company_id=mavis.company.id).all_transformations
            ]
        else:
            data["transformations"] = []

    elif update_field_slug == "root_all_dataset":
        if data["all_dataset"]:
            data["datasets"] = [
                d.id
                for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
                if d.status == d.status.live or d.created_by == mavis.user.id
            ]
        else:
            data["datasets"] = []

    elif update_field_slug == "root_create_export":
        if data["company_id"]:
            comp = graph_client.get_company_slug(id=data["company_id"]).company_by_pk

        # add the context
        data["context"] = "\n\n".join(
            [
                "# Missing Company",
                "You need to add the company that you want to send the data too",
            ]
            if not data["company_id"]
            else [
                "## To sync the data click copy and then paste the copied data the the link below",
                f"{PORTAL_URL}/{comp.slug}/manage/dynamic/batch_create",
            ]
        )

        big_obj = []

        if len(data["transformations"]) > 0:
            for transformation_id in data["transformations"]:
                # saving the data
                t_data = __transformation_to_data(mavis, transformation_id)
                t_data["process_configuration"]["new_activities"] = t_data["process_configuration"]["activity_slugs"]
                t_data["export_kind"] = "transformation"

                t_data = utils.remove_keys(t_data, ["id"])

                big_obj.append(t_data)

        if len(data["datasets"]) > 0:
            # get all the datasets
            current_datasets = {d.id: d for d in graph_client.dataset_index(company_id=mavis.company.id).dataset}
            dataset_updator = DatasetManager(mavis=mavis)
            for d_id in data["datasets"]:
                current_dataset = current_datasets[d_id]
                d_obj = dataset_updator.get_config(d_id)

                # upload the data
                big_obj.append(
                    dict(
                        export_kind="dataset",
                        name=current_dataset.name,
                        slug=current_dataset.slug,
                        description=current_dataset.description,
                        d_object=d_obj,
                    )
                )

        #  Save the data
        data["export_data"] = json.dumps(big_obj)
    return data


def run_data(mavis: Mavis, data: dict):
    content = []
    return [dict(type="markdown", value="\n".join(content))]
