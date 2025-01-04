from core.api.customer_facing.companies.helpers import create_company
from core.models.internal_link import PORTAL_URL
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_ui,
)
from core.v4.mavis import Mavis

TITLE = "Create new Company"
DESCRIPTION = "This allows you to create a new company"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            slug=_input("Company Slug"),
            email=_input("Company Admin Email"),
            payment_handled=_checkbox("Skip Payment Requirement"),
            is_demo=_checkbox("Set as Demo Account"),
            region=_drop_down(["US", "EU"], default="US"),
        ),
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "payment_handled",
            "is_demo",
            "region",
        ],
        "advanced_config",
    )
    schema_ui = dict(advanced_config=_make_ui(widget="BooleanToggleWidget"))

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    new_mavis = create_company(
        mavis.user.id,
        data["slug"],
        data["email"],
        payment_handled=data["payment_handled"] or False,
        is_demo=data["is_demo"] or False,
        region=data["region"] or "US",
    )

    content = [
        "Successfully Created Company",
        f"GO TO: {PORTAL_URL}/{new_mavis.company.slug}/",
        "\n<br>\n",
        f"Email was also sent to {data['email']} for them to start onboarding",
    ]

    return [dict(type="markdown", value="\n".join(content))]
