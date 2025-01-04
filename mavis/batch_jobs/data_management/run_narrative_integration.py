# from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core.constants import NARRATIVE_EMAIL_TEMPLATE
from core.decorators import mutex_task, with_mavis
from core.errors import InternalError
from core.graph import graph_client
from core.models.internal_link import urlify
from core.util.email import send_email
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.v4.analysisGenerator import assemble_narrative
from core.v4.mavis import Mavis


class NarrativeIntegrationError(InternalError):
    pass


@tracer.start_as_current_span("run_narrative_integration")
def run_integration(mavis: Mavis, integration, details):
    set_current_span_attributes(
        narrative_slug=integration.narrative.slug,
        integration_id=integration.id,
        integration_kind=integration.kind,
    )

    # run the narrative
    nar = assemble_narrative(mavis, integration.narrative.slug)

    if integration.kind == integration.kind.email:
        template_model = dict(
            context=(details.get("context") or "").replace("\n", "\n<br>\n"),
            narrative_slug=integration.narrative.slug,
            narrative_name=integration.narrative.name,
            snapshot=urlify(nar["output_key"].split("/")[-1][:-5]),
        )

        for u_id in details.get("user_ids") or []:
            user = graph_client.get_user(id=u_id).user_by_pk

            if user:
                send_email(
                    mavis.company,
                    user.email,
                    NARRATIVE_EMAIL_TEMPLATE,
                    template_model,
                    tag="narrative_integration",
                    skip_opt_out=True,
                    reply_to=details.get("reply_to"),
                )


@mutex_task(queue_name="narratives")
@with_mavis
def run_narrative_integration(mavis: Mavis, integration_id: str, **kwargs):
    integration = graph_client.get_narrative_integration(id=integration_id).narrative_integration
    # details = mavis.get_narrative_integration(integration_id)

    if integration:
        run_integration(mavis, integration, {})
    else:
        raise NarrativeIntegrationError("Could not find narrative integration id", integration_id=integration_id)
