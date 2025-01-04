import json
from copy import deepcopy

from core import utils
from core.api.customer_facing.reports.utils import NarrativeUpdator
from core.constants import TEMPLATE_REQUEST_EMAIL_TEMPLATE
from core.graph import graph_client, make_sync_client
from core.logger import get_logger
from core.models.company import query_graph_company
from core.models.ids import get_uuid
from core.util.email import send_email
from core.v4 import narrativeTemplate
from core.v4.analysisGenerator import assemble_narrative
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_steps,
    _make_ui,
    _move_dependency,
    _object,
    _space,
)
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import RESOLUTIONS

logger = get_logger()

TITLE = "Use Narrative Template V5"
DESCRIPTION = "Convert a template to a Narrative"
VERSION = 1

STEPS = [
    dict(title="Choose Template", status="choose"),
    dict(
        title="Answer Questions",
        status="question",
    ),
    dict(
        title="Save",
        status="save",
    ),
    dict(
        title="Review",
        status="finish",
    ),
]


def __get_activity(mavis: Mavis):
    try:
        all_activities = (
            make_sync_client(mavis.user.token).activity_index_w_columns(company_id=mavis.company.id).all_activities
        )
    except Exception:
        all_activities = graph_client.activity_index_w_columns(company_id=mavis.company.id).all_activities

    activity_droppdwn = [
        dict(
            id=a.id,
            value=a.id,
            table=a.company_table.activity_stream,
            label=f"{a.name} (from {a.company_table.activity_stream})",
            has_revenue=any(c for c in a.column_renames if c.name == "revenue_impact" and c.has_data) or False,
        )
        for a in all_activities
    ]

    return activity_droppdwn


def __get_narratives(mavis: Mavis):
    try:
        all_narratives = make_sync_client(mavis.user.token).narrative_index(company_id=mavis.company.id).narrative
    except Exception:
        all_narratives = graph_client.narrative_index(company_id=mavis.company.id).narrative

    narrative_droppdwn = [dict(slug=n.slug, id=n.id, label=f"{n.name}") for n in all_narratives]

    return narrative_droppdwn


def get_schema(mavis: Mavis, internal_cache):
    activity_droppdwn = __get_activity(mavis)
    narrative_droppdwn = __get_narratives(mavis)

    desired_type = internal_cache["type"]

    if mavis.user.is_internal_admin:
        all_templates = make_sync_client(mavis.user.token).get_all_templates().narrative_template

        template_values = dict()

        for t in all_templates:
            if template_values.get(t.name) is None and t.global_version == 5:
                template_values[t.name] = dict(
                    id=t.id,
                    label=f"{t.name} (v{t.global_version}.{t.customer_iteration}.{t.local_iteration})",
                    name=t.name,
                    type=t.type,
                    category=t.category,
                )
        template_dropdown = template_values.values()

        default_context = "\n\n".join(
            [
                "## You are a super Admin",
                " 1. You will see all the templates (Normal users only see what the access)",
                " 2. You will be running the most recent local version. (Customer will run the one that was last `deployed to customer`)",
            ]
        )
    else:
        default_context = "\n".join(
            [
                "## Choose a template ",
                "Templates can generate analyses of dashboards.  There are more templates that we have but you might not have access to.",
                "<br>",
            ]
        )
        all_templates = graph_client.get_company_templates(company_id=mavis.company.id).company_narrative_templates

        # Cleaned up the type
        template_dropdown = [
            dict(
                id=t.templates[0].id,
                label=t.templates[0].question or t.templates[0].name,
                name=t.templates[0].name,
                type=t.templates[0].type,
                category=t.templates[0].category,
            )
            for t in all_templates
        ]

        # add all the names
        added_name = [t["name"] for t in template_dropdown]

        free_templates = graph_client.get_free_templates(company_id=mavis.company.id).narrative_template

        # add all the free templates
        for ft in free_templates:
            if ft.name not in added_name and (
                (ft.in_free_tier and ft.local_iteration == 0)
                or (not ft.in_free_tier and (mavis.user.is_admin() or ft.local_iteration == 0))
            ):
                added_name.append(ft.name)
                template_dropdown.append(
                    dict(
                        id=ft.id,
                        label=(ft.question or ft.name) + ("(Internal)" if ft.company_id else ""),
                        category=ft.category,
                        type=ft.type,
                    )
                )

    default_context += "\n\n".join(
        [
            "<br>",
            "------",
            "## Don't see a Narrative/Dashboard you are looking for?",
            "Please submit any request and someone one from our team will reach out with the best template available.",
        ]
    )

    all_categories = ["all_templates"] + list(set([t.get("category") or "no_category" for t in template_dropdown]))

    # define the full schema
    schema = _object(
        dict(
            step_flow=_make_steps(
                kind="navigation",
                default=STEPS,
                clickable=False,
                next_button_label="Continue",
            ),
            step=_drop_down(STEPS, "status", "title", default=STEPS[0]["status"]),
            category=_drop_down(all_categories, default="all_templates", title="Category"),
            template_context=_input(default=default_context),
            request_text=_input(title="Request Details"),
            submit_request=_checkbox(title="Submit Request"),
            # force the user to enter a helpful name
            narrative_name=_input("Enter the Narrative name"),
            narrative_description=_input(
                "Enter Narrative Description",
            ),
            # The Narrative based on the behavior
            questions=_make_array(
                dict(
                    id=_input(),
                    kind=_drop_down(["activity", "feature", "word", "field_input"]),
                    answer_kind=_drop_down(["free_text", "dropdown", "time_resolution", "narratives"]),
                    question=_input("Question"),
                )
            ),
            create_context=_input(),
        ),
    )

    _hide_properties(schema, ["request_text", "submit_request"], "show_request", default=True)

    _move_dependency(
        schema,
        "step",
        "choose",
        [
            "category",
            "template_id",
            "template_context",
            "request_text",
            "submit_requst",
        ],
    )
    _move_dependency(schema, "step", "save", ["narrative_name", "narrative_description"])

    _move_dependency(schema, "step", "finish", ["create_context"])

    # process the categories
    for c in all_categories:
        _add_dependency(
            schema,
            "category",
            c,
            dict(
                template_id=_drop_down(
                    [
                        t
                        for t in template_dropdown
                        if (
                            c == "all_templates"
                            or (c == "no_category" and t.get("category") is None)
                            or t.get("category") == c
                        )
                        and (not desired_type or not t["type"].value or desired_type == t["type"].value)
                    ],
                    "id",
                    "label",
                    title="Choose a template",
                ),
            ),
        )

    # process the questions
    question_obj = schema["properties"]["questions"]["items"]
    _add_dependency(
        question_obj,
        "kind",
        "feature",
        dict(
            feature_id=_drop_down([], title="Feature"),
        ),
    )
    _add_dependency(
        question_obj,
        "kind",
        "activity",
        dict(activity_id=_drop_down(activity_droppdwn, "value", "label", title="Activity")),
    )

    # add the drop down to be dependent on the answer kind
    _add_dependency(
        question_obj,
        "answer_kind",
        "dropdown",
        dict(
            dropdown_input=_drop_down([]),
        ),
    )
    _add_dependency(
        question_obj,
        "answer_kind",
        "narratives",
        dict(
            narrative_input=_drop_down(narrative_droppdwn, "slug", "label", title="Narrative"),
        ),
    )

    _add_dependency(
        question_obj,
        "answer_kind",
        "time_resolution",
        dict(
            time_input=_drop_down(RESOLUTIONS[::-1], title="Time Option"),
        ),
    )

    _add_dependency(
        question_obj,
        "answer_kind",
        "free_text",
        dict(
            word=_input("Word Replacement"),
        ),
    )

    _move_dependency(schema, "step", "question", ["questions"])

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
                "step_flow",
                "step",
                "category",
                "template_id",
                "template_name",
                "template_context",
                "request_text",
                "submit_request",
                "questions",
                "narrative_name",
                "narrative_description",
                "create_context",
                "show_request",
            ],
        ),
        step=_make_ui(hidden=True),
        step_flow=_make_ui(
            field="step",
            options=dict(
                **_space(100, is_steps=True),
                process_data=True,
                loading_bar=[
                    dict(
                        percent=5,
                        text="Preparing the Next step",
                        duration=3,
                    ),
                    dict(
                        percent=20,
                        text="Creating the Narrative",
                        duration=10,
                    ),
                    dict(
                        percent=45,
                        text="Running the Narrative.\n\nThe Narrative is created so you can always close this and run from the Narrative Index.",
                        duration=26,
                    ),
                    dict(
                        percent=70,
                        text="Data taking longer than expected - We are processing all the datasets.\n\nThe Narrative is created so you can always close this and run from the Narrative Index.",
                        duration=46,
                    ),
                    dict(
                        percent=90,
                        text="This is unusual but your warehouse may be under more load right now. Please be patient.\n\nThe Narrative is created so you can always close this and run from the Narrative Index.",
                        duration=66,
                    ),
                ],
            ),
        ),
        category=_make_ui(options=dict(**_space(30))),
        template_id=_make_ui(options=dict(size="large", process_data=True, **_space(70))),
        show_request=_make_ui(hidden=True),
        request_text=_make_ui(widget="textarea", options=dict(rows=4)),
        submit_request=_make_ui(widget="BooleanButtonWidget", options=dict(process_data=True)),
        narrative_description=_make_ui(widget="textarea", options=dict(rows=4)),
        template_context=_make_ui(widget="MarkdownRenderWidget"),
        create_context=_make_ui(widget="MarkdownRenderWidget"),
        questions=dict(
            **_make_ui(
                options=dict(
                    title=False,
                    orderable=False,
                    removable=False,
                    addable=False,
                )
            ),
            items=dict(
                **_make_ui(
                    order=[
                        "id",
                        "kind",
                        "answer_kind",
                        "question",
                        "activity_id",
                        "feature_id",
                        "feature_name",
                        "word",
                        "narrative_input",
                        "time_input",
                        "dropdown_input",
                    ],
                ),
                # keys that are hidden from the UI but are used in the filters
                id=_make_ui(hidden=True),
                kind=_make_ui(hidden=True),
                answer_kind=_make_ui(hidden=True),
                # show the question
                question=_make_ui(widget="MarkdownRenderWidget", options=_space(50)),
                # Choose the new id
                activity_id=_make_ui(options=dict(load_values=True, process_data=True, **_space(50))),
                feature_id=_make_ui(options=dict(load_values=True, **_space(50))),
                # choose the new options
                word=_make_ui(options=_space(50)),
                time_input=_make_ui(options=_space(50)),
                dropdown_input=_make_ui(options=dict(load_values=True, **_space(50))),
                narrative_input=_make_ui(options=_space(50)),
            ),
        ),
    )
    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data, internal):
    internal["type"] = data["type"]
    return internal


def run_data(mavis: Mavis, data: dict):
    return []


def update_feature_question(mavis: Mavis, template, questions, q, activities):
    # only update features
    if q["kind"] == "feature":
        (
            template,
            activity_mapping,
            word_mapping,
            _,
        ) = __get_template(
            mavis,
            template.id,
            questions,
            update_values=True,
            template=template,
            activities=activities,
        )

        # get the options for the question
        values = narrativeTemplate.get_valid_columns(
            mavis,
            template,
            q["id"],
            activity_mapping,
            word_mapping,
            skip_update=False,
        )
        q["feature_id"] = utils.pick_best_option(values, q["default_answer"])["value"]

    return template


def process_data(mavis: Mavis, data, updated_field_slug=None):
    template = None

    activities = {a.id: a for a in graph_client.activity_index_w_columns(company_id=mavis.company.id).all_activities}

    # deal with loading the template

    if updated_field_slug in ("root_submit_request"):
        send_email(
            mavis.company,
            ["support@narrator.ai"],
            TEMPLATE_REQUEST_EMAIL_TEMPLATE,
            dict(submitter_email=mavis.user.email, request_text=data["request_text"]),
            "template-request",
        )

        # show the data input data
        data["template_context"] = "\n".join(
            [
                "# ✅ Request has been submitted",
                "A member from our team will reach out pretty soon and give you some recommendations.",
            ]
        )
        data["_notification"] = utils.Notification(
            message="Submitted Request",
            type=utils.NotificationTypeEnum.SUCCESS,
            duration=2,
        )

    elif updated_field_slug in ("root_template_id"):
        # create the template and update the values
        template = __get_template(mavis, data["template_id"])[0]

        # show the data input data
        data["template_context"] = template.additional_context
        data["show_request"] = False

    elif updated_field_slug and updated_field_slug.endswith("activity_id"):
        # get the template
        template = __get_template(mavis, data["template_id"])[0]

        # update the data for any features
        for q in data["questions"]:
            template = update_feature_question(mavis, template, data["questions"], q, activities)

    elif updated_field_slug == "step_flow" and data["step_flow"]["current"] == 1:
        if not data["template_id"]:
            data["_notification"] = utils.Notification(
                message="Please Choose a template",
                type=utils.NotificationTypeEnum.WARNING,
            )
            data["step_flow"]["current"] = 0
            return data

        template = __get_template(mavis, data["template_id"])[0]

        data["questions"] = [
            dict(
                id=q["id"],
                kind=q["kind"],
                **{k: v for k, v in q["left"].items() if k not in ("kind", "id")},
            )
            for q in template.questions
        ]

        all_activities = graph_client.activity_index_w_columns(company_id=mavis.company.id).all_activities

        # refresh the company table if we don't see any tables
        if len(mavis.company.tables) == 0:
            query_graph_company(mavis.company.slug, refresh_cache=True)

        # save the activities
        activities = {
            a.id: a
            for a in all_activities
            if len(mavis.company.tables) == 0
            or a.company_table.activity_stream == mavis.company.tables[-1].activity_stream
        }

        try:
            # once we create the input then go head and try and guess all the data
            guess_question_answers(mavis, data["questions"], template, activities)
        except Exception:  # noqa: S110
            logger.exception("Error guessing the answers")

    # deal with create the narrative
    elif updated_field_slug == "step_flow" and data["step_flow"]["current"] == 2:
        # create the template and update the values
        template = __get_template(mavis, data["template_id"], data["questions"], update_values=True)[0]

        # save the questions as part of the narrative
        template.narrative["questions"] = deepcopy(data["questions"])

        feature_mapping = {f.old_id: f for d in template.datasets for f in d.feature_mapping}

        # load the proper feature and activities
        for q in template.narrative["questions"]:
            if q["kind"] == "feature":
                q["new_feature_id"] = feature_mapping[q["id"]].new_id
                q["feature_name"] = feature_mapping[q["id"]].display_name

            elif q["kind"] == "activity":
                q["activity_name"] = activities[q["activity_id"]].name

        template.id = data["template_id"]

        data["narrative_slug"] = utils.slugify((template.narrative.get("name") or template.name) + get_uuid()[-8:])
        # override the narrative slug
        if data.get("override_narrative_slug"):
            data["narrative_slug"] = data["override_narrative_slug"]

        # add the template name
        data["narrative_name"] = template.narrative.get("name", f'RENAME: {data["template_name"]}')
        data["narrative_description"] = template.narrative.get(
            "description"
            or "IMPORTANT - Enter description about how you used this template and what it is supposed to deliver",
        )
        # create the narrative
        saved_files = narrativeTemplate.create_narrative(
            mavis,
            template,
            add_to_graph=True,
            narrative_slug=data["narrative_slug"],
            narrative_type=template.type,
            hide_dataset=False,
            override_name=data.get("override_name"),
        )

        data["saved_files"] = saved_files
        data["template_type"] = template.type or "narrative"
        data["narrative_id"] = saved_files["narrative_id"]

    elif updated_field_slug == "step_flow" and data["step_flow"]["current"] == 3:
        # update the data in graph
        make_sync_client(mavis.user.token).update_narrative_meta(
            company_id=mavis.company.id,
            slug=data["narrative_slug"],
            name=data["narrative_name"],
            description=data["narrative_description"],
        )
        # get the narrative!
        narrative_updator = NarrativeUpdator(mavis=mavis)
        narrative_id = narrative_updator._slug_to_id(data["narrative_slug"])
        narrative_config = narrative_updator.get_config(narrative_id)

        # assemble the data
        assemble_narrative(
            mavis,
            narrative_slug=data["narrative_slug"],
            config=narrative_config,
            cache_minutes=None,
        )

        if data["template_type"] == "dashboard":
            url_path = "dashboards"
        else:
            url_path = "narratives"

        # show some confetti
        data["_redirect_url"] = f"/{url_path}/a/{data['narrative_slug']}"

    data["step"] = STEPS[data["step_flow"]["current"]]["status"]
    return data


# get the values that are allowed
def get_values(mavis: Mavis, data, updated_field_slug=None):
    values = []

    if updated_field_slug.endswith("dropdown_input"):
        ii = int(updated_field_slug.split("_")[-3])
        values = [dict(value=option, label=option) for option in data["questions"][ii]["dropdown_options"]]

    elif updated_field_slug.endswith("narrative_slug"):
        values = [
            dict(value=n.slug, label=n.name)
            for n in graph_client.narrative_index(company_id=mavis.company.id).narrative
        ]

    elif updated_field_slug.endswith("activity_id"):
        ii = int(updated_field_slug.split("_")[-3])
        requires_revenue = data["questions"][ii]["requires_revenue"]

        values = [a for a in __get_activity(mavis) if not requires_revenue or a["has_revenue"]]

    elif updated_field_slug.endswith("feature_id"):
        ii = int(updated_field_slug.split("_")[-3])

        # deal with getting the config
        (template, activity_mapping, word_mapping, _) = __get_template(
            mavis, data["template_id"], data["questions"], update_values=True
        )

        # get the valid columns for the Narrative
        values = narrativeTemplate.get_valid_columns(
            mavis,
            template,
            data["questions"][ii]["id"],
            activity_mapping,
            word_mapping,
            skip_update=True,
        )
    return dict(values=values)


def guess_question_answers(mavis: Mavis, questions, template, activities):
    all_narratives = None
    all_activities = None

    kinds = ["word", "activity", "feature", "narratives"]
    # answer the questions
    for k in kinds:
        for q in questions:
            if k != q["kind"]:
                continue

            # ignore answers with out a default
            if not q.get("default_answer"):
                continue

            if q["kind"] == "activity":
                if all_activities is None:
                    all_activities = [
                        a for a in __get_activity(mavis) if a["table"] == mavis.company.tables[-1].activity_stream
                    ]

                q["activity_id"] = utils.pick_best_option(
                    [a for a in all_activities if not q["requires_revenue"] or a["has_revenue"]],
                    q["default_answer"],
                )["id"]

            elif q["kind"] == "feature":
                update_feature_question(mavis, template, questions, q, activities)

            elif q["kind"] == "word" and q["answer_kind"] == "time_resolution":
                q["time_input"] = utils.pick_best_option(RESOLUTIONS, q["default_answer"])

            elif q["kind"] == "word" and q["answer_kind"] == "narratives":
                if all_narratives is None:
                    all_narratives = __get_narratives(mavis)

                q["narrative_input"] = utils.pick_best_option(all_narratives, q["default_answer"])["slug"]

            elif q["kind"] == "word" and q["answer_kind"] == "dropdown":
                q["dropdown_input"] = utils.pick_best_option(q["dropdown_options"], q["default_answer"])

            elif q["kind"] == "word" and q["answer_kind"] == "free_text":
                q["word"] = q["default_answer"]

            __update_answer(q)
    return template


def __update_answer(q):
    if q["kind"] == "word":
        if q["answer_kind"] == "time_resolution":
            q["word"] = q.get("time_input")
        elif q["answer_kind"] == "narratives":
            q["word"] = q.get("narrative_input")
        elif q["answer_kind"] == "dropdown":
            q["word"] = q.get("dropdown_input")


def __get_template(
    mavis: Mavis,
    template_id,
    questions=None,
    update_values=False,
    template=None,
    activities=None,
):
    if questions is None:
        questions = []

    # deal with the fact that inputs have different name
    # update all the questions to point at word (we couldn't make everything point to word because of load_values and
    # the schema UI being different)
    for q in questions:
        __update_answer(q)

    # setup the template
    if not template:
        # get the template
        template_obj = graph_client.get_template(id=template_id).narrative_template_by_pk

        # create the template object
        template = narrativeTemplate.Template(**json.loads(template_obj.template))

    # activity_mapping
    activity_mapping = {q["id"]: q["activity_id"] for q in questions if q["kind"] == "activity"}

    # word_mapping
    word_mapping = {q["id"]: q.get("word") or "NO WORD" for q in questions if q["kind"] == "word"}

    # deal with variables in the name and description
    for q in questions:
        if q["kind"] == "field_input":
            old_id = "{%s}" % q["id"]
            new_id = q["word"]

            # variable the name and description
            for kv in ("name", "description"):
                if template.narrative.get(kv):
                    template.narrative[kv] = template.narrative[kv].replace(old_id, new_id)

    # feature_mapping - the feature_id is the name of the column
    feature_mapping = {q["id"]: q["feature_id"] for q in questions if q["kind"] == "feature" if q.get("feature_id")}

    if update_values:
        # Also map the question id to the template
        # The old_id  is always q["id"] and the new id is the input
        narrativeTemplate.update_template_with_values(
            mavis,
            template,
            activity_mapping,
            word_mapping,
            feature_mapping,
            activities=activities,
        )

        # handle the field
        for q in questions:
            if q["kind"] == "field_input":
                for f in template.narrative["field_configs"]:
                    if f["kind"] == "value_field" and q["id"] == f["name"] and q.get("word"):
                        f["value"]["content"] = q["word"]
                        break

    return (template, activity_mapping, word_mapping, feature_mapping)
