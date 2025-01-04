from core import utils
from core.api.v1.dataset.helpers import archive_dataset
from core.api.v1.endpoints.admin.transformation import _delete_transformation
from core.graph import graph_client
from core.v4.blocks.shared_ui_elements import _checkbox, _drop_down, _make_ui, _space
from core.v4.blocks.transformation_context_v2 import _remove_from_production
from core.v4.mavis import Mavis

TITLE = "Batch Delete"
DESCRIPTION = "This allows you to delete Narratives, Datasets and Transformations (or remove from production)."
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    users = {u.id: u.email for u in graph_client.get_all_users(company_id=mavis.company.id).user}

    # load from cache
    all_datasets = get_list(mavis, "datasets", users=users)
    # load from cache
    all_narratives = get_list(mavis, "narratives", users=users)

    # load from cache
    all_transformations = get_list(mavis, "transformations", users=users)

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            datasets=_drop_down(
                all_datasets,
                "id",
                "name",
                is_multi=True,
                title="Datasets",
            ),
            all_datasets=_checkbox("Select All"),
            narratives=_drop_down(
                all_narratives,
                "id",
                "name",
                is_multi=True,
                title="Narratives",
            ),
            all_narratives=_checkbox("Select All"),
            transformations=_drop_down(
                all_transformations,
                "id",
                "name",
                is_multi=True,
                title="Transformations",
            ),
            all_transformations=_checkbox("Select All"),
            remove_from_prod=_checkbox("Only Remove from Production"),
            archive_all=_checkbox("Archive All"),
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
        datasets=_make_ui(options=dict(data_public=True, **_space(80))),
        all_datasets=_make_ui(options=dict(process_data=True, **_space(20, inline_button=True))),
        narratives=_make_ui(options=dict(data_public=True, **_space(80))),
        all_narratives=_make_ui(options=dict(process_data=True, **_space(20, inline_button=True))),
        transformations=_make_ui(options=dict(data_public=True, **_space(80))),
        all_transformations=_make_ui(options=dict(process_data=True, **_space(20, inline_button=True))),
        remove_from_prod=_make_ui(options=dict(data_public=True, **_space(100))),
        archive_all=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                button_type="primary",
                process_data=True,
                danger=True,
                popconfirm=True,
                popconfirm_text="Are you sure you want to archive all these!",
                **_space(50),
            ),
        ),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def get_list(mavis, kind, users=None):
    if not users:
        users = {}

    if kind == "datasets":
        return [
            dict(
                id=d.id,
                name=f'{d.name} (by {users.get(d.created_by, "No USER")} {utils.pretty_diff(d.updated_at, utils.utcnow(), "past")})',
            )
            for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
        ]

    elif kind == "narratives":
        return [
            dict(
                id=d.id,
                name=f'{d.name} (by {users.get(d.created_by, "No USER")} {utils.pretty_diff(d.updated_at, utils.utcnow(), "past")})',
            )
            for d in graph_client.narrative_index(company_id=mavis.company.id).narrative
        ]

    elif kind == "transformations":
        return [
            dict(
                id=d.id,
                name=f'{d.name} ({d.kind} - {"PROD" if d.production_queries_aggregate.aggregate.count > 0 else "in_progress"})',
            )
            for d in graph_client.transformation_index(company_id=mavis.company.id).all_transformations
        ]


def __delete_narrative(mavis, narrative_id):
    narrative = graph_client.get_narrative(id=narrative_id).narrative_by_pk
    graph_client.get_task_by_slug(company_id=mavis.company.id, slug=f"n_{narrative.slug}")

    # delete the narrative
    graph_client.execute(
        """
        mutation DeleteNarrative($id: uuid!) {
            update_narrative_by_pk(pk_columns: {id: $id}, _set: {state: archived}) {
                id
            }
            update_dataset(where: {dependent_narratives: {narrative_id: {_eq: $id}}}, _set: {status: archived}) {
                returning {
                    id
                }
            }
        }
        """,
        dict(id=narrative_id),
    )


def process_data(mavis: Mavis, data, update_field_slug):
    if update_field_slug.startswith("root_all_"):
        kind = update_field_slug.split("_")[-1]
        if data[f"all_{kind}"]:
            data[kind] = [d["id"] for d in get_list(mavis, kind)]
        else:
            data[kind] = []

    elif update_field_slug == "root_archive_all":
        # delete all the the narratives
        for n_id in data["narratives"] or []:
            __delete_narrative(mavis, n_id)

        for d_id in data["datasets"] or []:
            archive_dataset(mavis, d_id)

        # delete or undeploy transformations
        if data["transformations"]:
            for t_id in data["transformations"] or []:
                if data["remove_from_prod"]:
                    _remove_from_production(mavis, t_id)
                else:
                    _delete_transformation(mavis, t_id)

    return data


def run_data(mavis: Mavis, data: dict):
    content = []
    return [dict(type="markdown", value="\n".join(content))]
