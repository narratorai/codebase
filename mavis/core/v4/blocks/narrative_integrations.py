from core import utils
from core.api.customer_facing.tasks.utils import TaskManager
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import company_task_category_enum
from core.util.opentelemetry import tracer
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _checkbox,
    _drop_down,
    _get_narrative,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
    _user_drop_down,
)
from core.v4.mavis import Mavis

TITLE = "Narrative Integrations"
DESCRIPTION = "Add and remove integrations of a Narrative"
VERSION = 1


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # define the full schema
    schema = _object(
        dict(
            id=_drop_down(_get_narrative(mavis), "id", "name", title="Narrative"),
            save=_checkbox("Save"),
            integrations=_make_array(dict(kind=_drop_down(["email"], default="email"))),
        )
    )

    integration_schema = schema["properties"]["integrations"]["items"]
    # hide properties
    _add_dependency(
        integration_schema,
        "kind",
        "email",
        dict(
            reply_to=_input("Reply To", default=mavis.user.email),
            context=_input("Additional context"),
            user_ids=_user_drop_down(mavis, "Email to", is_multi=True),
        ),
    )

    is_admin = mavis.user.is_admin

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
                "id",
                "save",
                "integrations",
            ],
        ),
        id=_make_ui(options=dict(process_data=True, **_space(70))),
        save=_make_ui(
            disabled=not is_admin,
            help_text=None if is_admin else "Only Company Admins can edit an Dimension",
            widget="BooleanButtonWidget",
            options=dict(
                **_space(30, align_right=True),
                process_data=True,
                button_type="primary",
            ),
        ),
        integrations=dict(
            **_make_ui(
                disabled=not is_admin,
                order=[
                    "kind",
                    "*",
                ],
                options=dict(orderable=False, addable=True, removable=True, **_space(80)),
            ),
            items=dict(
                context=_make_ui(
                    widget="textarea",
                    options=dict(rows=3),
                )
            ),
        ),
    )

    return (schema, schema_ui)


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["id"] = data["id"]
    return internal


def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    """
    Get the values that are allowed
    """
    return None


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug=None):
    narrative_id = data["id"]

    # handle the resets
    if updated_field_slug == "root_id":
        data = serialize_integration(mavis, narrative_id)

    elif updated_field_slug == "root_save":
        if not mavis.user.is_admin:
            raise SilenceError("Only company admins can update the Activity")

        current_data = serialize_integration(mavis, narrative_id)
        (added, removed, updated) = utils.diff_objects(current_data["integrations"], data["integrations"])

        schedule = "0 6 * * 1"
        for integration in added:
            kind = integration["kind"]
            n_id = graph_client.insert_narrative_integration(
                narrative_id=narrative_id,
                kind=kind,
            ).insert_narrative_integrations_one.id

            from batch_jobs.data_management.run_narrative_integration import (
                run_narrative_integration,
            )

            # schedule the run
            TaskManager(mavis=mavis).create(
                run_narrative_integration,
                schedule,
                task_slug=f"n_{utils.slugify(data['name'])}_{integration['kind']}",
                task_fields=dict(integration_id=n_id),
                category=company_task_category_enum.materializations.value,
                update_db_table="narrative_integrations",
                update_db_id=n_id,
            )

            # integration_data = {k: v for k, v in integration.items() if k != "kind"}
            # mavis.upload_narrative_integration(n_id, integration_data)

        # for integration in updated:
        # integration_data = {k: v for k, v in integration.items() if k != "kind"}
        # mavis.upload_narrative_integration(integration["id"], integration_data)

        for integration in removed:
            graph_client.delete_narrative_integration(id=integration["id"])

        # reset the data
        data = serialize_integration(mavis, narrative_id)
        data["_notification"] = utils.Notification(
            message="Saved Changes",
            type=utils.NotificationTypeEnum.SUCCESS,
            duration=2,
        )

    return data


def run_data(mavis: Mavis, data: dict):
    return []


def serialize_integration(mavis: Mavis, narrative_id: str):
    narrative = graph_client.get_all_narrative_integrations(id=narrative_id).narrative
    # integrations = [
    #     dict(
    #         integration.dict(),
    #         **mavis.get_narrative_integration(integration.id) or {},
    #     )
    #     for integration in narrative.integrations
    # ]

    return dict(
        id=narrative_id,
        slug=narrative.slug,
        name=narrative.name,
        integrations=[],  # integrations,
    )
