import os

from core.constants import DOC_URL
from core.models.company import Company
from core.models.internal_link import PORTAL_URL


def get_doc(company: Company, file_name: str, **kwargs):
    file_path = os.path.realpath(f"{os.path.dirname(__file__)}/{file_name}.md")

    with open(file_path) as f:
        text = f.read()

    text += "\n\n".join(
        [
            "\n\n<br><br>\n\n",
            "## Still have questions?",
            "Our data team is here to help! Here are a couple ways to get in touch...",
            "💬 Chat with us from within Narrator - Use the chat bubble in the bottom of the nav bar",
            "💌 Email us at [support@narrator.ai](mailto:support@narrator.ai)",
            "🗓 Or schedule a [15 minute meeting](https://calendly.com/narrator-support/15-minute-meeting) with our data team",
        ]
    )
    return text.replace("doc:", DOC_URL + "docs/").format(
        company_slug=company.slug,
        company_name=company.name,
        user_email=company.user.email,
        company_url=PORTAL_URL + f"/{company.slug}",
        timezone=company.timezone,
        warehouse_language=company.warehouse_language,
        **kwargs,
    )
