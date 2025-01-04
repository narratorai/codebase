from dramatiq import actor
from postmarker.core import PostmarkClient

from core.graph import sync_client as graph
from core.logger import get_logger
from core.models.company import Company
from core.models.internal_link import PORTAL_URL
from core.models.settings import settings
from core.models.time import make_local, utcnow
from core.models.user import UserCompany
from core.util.opentelemetry import tracer

logger = get_logger()
postmark_client = PostmarkClient(server_token=settings.postmark_api_key.get_secret_value())


@tracer.start_as_current_span("send_task_notification_email")
def send_task_notification_email(template_id: str, company, email_details, send_to: str):
    template_model = {
        "company_slug": company.slug,
        "company_name": company.name,
        "company_url": f"{PORTAL_URL}/{company.slug}",
    } | email_details

    send_with_template(
        template_id,
        model=template_model,
        to=send_to,
        tag="task_notification",
        reply_to="support@narrator.ai",
    )


@actor(queue_name="email")
@tracer.start_as_current_span("send_email")
def send_email(
    company: Company | UserCompany,
    to_emails: list | str,
    template_id,
    template_model,
    tag=None,
    skip_opt_out=False,
    reply_to="support@narrator.ai",
    attachments: list[dict] = None,
):
    if not isinstance(to_emails, list):
        to_emails = [to_emails]

    # allow skipping opt out
    opt_out_emails = [] if skip_opt_out else [u.email for u in graph.get_opt_out_emails(company_id=company.id).user]

    recipients = ",".join(
        [o.replace("Narrator", "support@narrator.ai") for o in to_emails if o and o not in opt_out_emails]
    )

    if not recipients:
        logger.info("No one to send to")
        return None

    local_time = make_local(utcnow(), company.timezone if isinstance(company, Company) else "EDT")

    template_defaults = dict(
        local_time=local_time,
        date=local_time[:10],
        company_slug=company.slug,
        company_id=company.id,
        company_name=company.name,
        company_url=f"{PORTAL_URL}/{company.slug}",
    )
    for k, v in template_defaults.items():
        if k not in template_model.keys():
            template_model[k] = v

    try:
        send_with_template(
            template_id, model=template_model, to=recipients, tag=tag, reply_to=reply_to, attachments=attachments
        )
    except Exception:
        send_with_template(
            template_id,
            model=template_model,
            to="support@narrator.ai",
            tag=tag,
            reply_to=reply_to,
            attachments=attachments,
        )


@tracer.start_as_current_span("send_with_template")
def send_with_template(id: str, *, model, to: str, tag: str, reply_to: str, attachments: list[dict] = None):
    postmark_client.emails.send_with_template(
        TemplateId=id,
        TemplateModel=model,
        From="support@narrator.ai",
        ReplyTo=reply_to or "support@narrator.ai",
        To=to,
        TrackOpens=True,
        TrackLinks="HtmlAndText",
        Tag=tag,
        Attachments=attachments,
    )

    logger.info("Email sent", to=to, template_id=id, tag=tag)


@tracer.start_as_current_span("send_with_template")
def send_raw_email(to: str, subject: str, body: str, tag: str = None):
    # send an email with the body via postmark
    postmark_client.emails.send(
        From="support@narrator.ai",
        To=to,
        Subject=subject,
        TextBody=body,
        Tag=tag,
        TrackOpens=True,
    )


def send_tracked_email(user, **kwargs):
    # remove markdown from the text body
    if "TextBody" in kwargs:
        kwargs["TextBody"] = kwargs["TextBody"].replace("**", "").replace("###", "")

    if "override_client" in kwargs:
        use_client = kwargs.pop("override_client")
    else:
        use_client = postmark_client

    # send the email
    sent_email = use_client.emails.send(
        **{k: v for k, v in kwargs.items() if k not in ("fivetran_url", "override_client")}
    )
    return sent_email
