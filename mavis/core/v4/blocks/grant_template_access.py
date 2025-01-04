from core.graph import graph_client, make_sync_client
from core.v4.blocks.shared_ui_elements import _drop_down, _make_ui
from core.v4.mavis import Mavis

TITLE = "Grant Template Access"
DESCRIPTION = "Give this company access to any template"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    all_templates = list({t.name for t in graph_client.get_all_templates().narrative_template if t.global_version == 5})
    current_templates = (
        make_sync_client(mavis.user.token)
        .get_company_templates(company_id=mavis.company.id)
        .company_narrative_templates
    )

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            template_name=_drop_down(
                all_templates,
                is_multi=True,
                default=[t.templates[0].name for t in current_templates],
                title="Template Name",
            )
        ),
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_submit=False),
        )
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    graph_client.update_company_templates(
        company_id=mavis.company.id,
        templates_input=[dict(company_id=mavis.company.id, template_name=name) for name in data["template_name"]],
    )

    return [dict(type="markdown", value="GRANTED")]
