from core import utils
from core.errors import ForbiddenError
from core.graph import graph_client
from core.models.service_limit import ServiceLimit
from core.util.email import send_email
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_ui,
    _object,
)
from core.v4.mavis import Mavis

TITLE = "Service Edit"
DESCRIPTION = "View and update service limits"
VERSION = 1

LIMITS = (
    "activity",
    "transformations",
    "datasets",
    "materializations",
    "row_limit",
    "activity_stream_limit",
    "narratives",
    "disable_on",
)

SERVICES = (
    [
        dict(
            slug="startup",
            name="Startup",
            activity_limit=5,
            activity_stream_limit=1,
            disable_on=None,
            narrative_limit=0,
            dataset_limit=None,
            materialization_limit=None,
            user_limit=20,
            transformation_limit=10,
        )
    ]
    + [
        dict(
            slug=f"standard_{lim}",
            name=f"Standard ({utils.human_format(lim * 10**6)} Rows)",
            activity_limit=20,
            activity_stream_limit=2,
            disable_on=None,
            narrative_limit=20,
            dataset_limit=None,
            materialization_limit=None,
            user_limit=20,
            transformation_limit=40,
        )
        for lim, price in [
            (20, 200),
            (50, 360),
            (100, 640),
            (200, 900),
            (300, 1300),
            (400, 1650),
            (500, 1950),
        ]
    ]
    + [
        dict(
            slug="enterprise",
            name="Enterprise",
            activity_limit=None,
            dataset_limit=None,
            materialization_limit=None,
            activity_stream_limit=5,
            narrative_limit=None,
            user_limit=None,
            transformation_limit=None,
            monthly_price="Custom",
        )
    ]
)


def get_schema(mavis: Mavis, internal_cache: dict):
    service_data, current_limit, at_limit = get_service_limit(mavis)
    valid_plans = get_valid_plans(mavis, service_data)

    # get the default headers
    header_mk, diff_mk = get_mk(service_data, current_limit, at_limit, None)

    # short
    is_enterprise = len(valid_plans) == 1
    button_title = "Request Enterprise Plan" if is_enterprise else "Update Plan"

    # define the full schema
    schema = _object(
        dict(
            header_mk=_input(default=header_mk),
            compared_to=_drop_down(
                valid_plans,
                slug_key="slug",
                name_key="name",
                title="Compare Another Plan",
            ),
            diff_mk=_input(default=diff_mk),
            upgrade=_checkbox(button_title),
            results_mk=_input(),
            extend_trial=_checkbox("Extend Trial 7 days"),
        )
    )

    # hide properties
    _hide_properties(
        schema,
        ["upgrade", "results_mk"],
        "can_change",
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
                "header_mk",
                "compared_to",
                "diff_mk",
                "upgrade",
                "results_mk",
                "can_change",
                "extend_trial",
            ],
        ),
        header_mk=_make_ui(widget="MarkdownRenderWidget"),
        compared_to=_make_ui(options=dict(process_data=True)),
        diff_mk=_make_ui(widget="MarkdownRenderWidget"),
        upgrade=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="primary" if at_limit else "secondary",
                popconfirm=not is_enterprise,
                popconfirm_text="Confirm that you want to update your plan.",
            ),
        ),
        extend_trial=_make_ui(
            widget="BooleanButtonWidget",
            hidden=not mavis.user.is_internal_admin or current_limit.disable_on is None,
            options=dict(process_data=True, button_type="primary"),
        ),
        results_mk=_make_ui(widget="MarkdownRenderWidget"),
        can_change=_make_ui(hidden=True),
    )
    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def get_mk(service_data, current_limit, at_limit, compared_to):
    # create the header text
    header_mk = "# Current plan: {current_plan}\n<br>\n".format(current_plan=current_limit.name or "Startup")

    # add the at limit
    if at_limit:
        header_mk += "\n> ⚠️   You appear to be at your limit, please choose a new plan to compare."

    diff_mk = "\n<br>\n\n".join(
        [
            utils.human_format(service_data, "table"),
            "[*See more pricing details on our website.*](https://www.narrator.ai/pricing)",
            "",
            "\n\n".join(
                [
                    "## How to Upgrade",
                    "1. Select the plan you want from the dropdown",
                    "2. Hit Update Plan and confirm",
                    "3. Look for an email from sales@narrator.ai with instructions to update your billing information",
                ]
            ),
            "**Have questions?** Chat us or send an email to sales@narrator.ai.",
        ]
    )
    return (header_mk, diff_mk)


def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    compared_to = None
    # add the compared to
    if data["compared_to"]:
        compared_to = next(s for s in SERVICES if s["slug"] == data["compared_to"])

    # get the current limit and the data
    service_data, current_limit, at_limit = get_service_limit(mavis, compared_to)

    # add a boolean to show the button
    data["can_change"] = compared_to is not None and (
        compared_to["monthly_price"] == "Custom"
        or int(compared_to["monthly_price"] or 0) != int(current_limit.monthly_price or 0)
    )

    # get the markdown
    (data["header_mk"], data["diff_mk"]) = get_mk(service_data, current_limit, at_limit, compared_to)

    if updated_field_slug == "root_extend_trial":
        if not mavis.user.is_internal_admin:
            raise ForbiddenError("You must be a super admin to update the trial")

        # all the user to extend the disable on
        new_date = utils.date_add(utils.utcnow(), "day", 7)
        if current_limit.disable_on is None or current_limit.disable_on < new_date:
            graph_client.execute(
                """
                    mutation UpdateDisabledOn(
                        $id: uuid!
                        $disable_on: timestamptz
                    ) {
                        update_service_limit_by_pk(
                            pk_columns: { id: $id }
                            _set: { disable_on: $disable_on }
                        ) {
                            id
                        }
                    }
                """,
                dict(id=current_limit.id, disable_on=new_date),
            )
        else:
            data["_notification"] = utils.Notification(
                message="Trial still has at least 7 days so cannot update it",
                type=utils.NotificationTypeEnum.SUCCESS,
            )

    # if the user is upgrading
    elif updated_field_slug == "root_upgrade":
        send_email(
            mavis.company,
            ["cedric@narrator.ai", "matt@narrator.ai"],
            19995001,
            dict(current_plan=current_limit.dict(), new_plan=compared_to),
            "sales-change-request",
        )

        if compared_to["monthly_price"] == "Custom":
            data["results_mk"] = "\n<br>\n".join(
                [
                    "## Thank you for requesting an upgrade to our {new_plan} plan.".format(
                        new_plan=utils.title(compared_to["name"])
                    ),
                    "A sales person will reach out to you shortly",
                ]
            )
        else:
            data["results_mk"] = "\n\n".join(
                [
                    "## Your plan was updated to {new_plan}.".format(new_plan=utils.title(data["compared_to"])),
                    "Look for an email from sales@narrator.ai with instructions to update your billing information.",
                    "In the meantime, we went ahead and updated your limits so you can resume your work.",
                    "<br>",
                    "Please refresh to see the new plan in action.",
                ]
            )

            # Deletes and inserts new limit
            compared_to["company_id"] = mavis.company.id
            graph_client.insert_service_limit(**{k: v for k, v in compared_to.items() if k not in ("slug")})

    return data


def run_data(mavis: Mavis, data: dict):
    return []


def get_service_limit(mavis, compared_to=None):
    company_limit = mavis._get_company_limit()

    data = dict(
        columns=[
            dict(name=n)
            for n in ["status", "name", "current_usage", "current_limit"]
            + (["to", "new_limit", "available"] if compared_to else [])
        ],
        rows=[],
    )
    at_limit = False

    for service_limit in LIMITS:
        if ServiceLimit(service_limit) == ServiceLimit.DISABLE_ON:
            limit_name = "Trial Period Days"
            count = utils.date_diff(mavis.company.created_at, utils.utcnow(), "day")
            count_limit = (
                utils.date_diff(mavis.company.created_at, company_limit.disable_on, "day")
                if company_limit.disable_on
                else None
            )

        else:
            (count, limit_name) = mavis._get_current_limit(ServiceLimit(service_limit))
            count_limit = getattr(company_limit, limit_name)

        # choose the status
        if count_limit is None:
            status = "✅"
        elif count >= int(count_limit):
            status = "🛑"
            at_limit = True
        elif count >= 0.8 * int(count_limit):
            status = "⚠️"
        else:
            status = "✅"

        row = dict(
            status=status,
            name=utils.title(limit_name),
            current_usage=count,
            current_limit=(
                int(count_limit)
                if count_limit is not None
                else ("Unlimited" if service_limit != "disable_on" else "Never")
            ),
        )

        # add the comparison
        if compared_to:
            row.update(
                to='<span style="color:green"> → </span>',
                new_limit=(compared_to[limit_name] if compared_to.get(limit_name) is not None else "Unlimited"),
                available=(
                    (compared_to[limit_name] - int(count or 0)) if compared_to.get(limit_name) is not None else "-"
                ),
            )

        data["rows"].append(row)

    return (data, company_limit, at_limit)


def get_valid_plans(mavis, data):
    valid_services = []

    for s in SERVICES:
        if all(
            s.get(utils.slugify(row["name"])) is None or row["current_usage"] <= s[utils.slugify(row["name"])]
            for row in data["rows"]
        ):
            valid_services.append(s)

    return valid_services
