import json

from batch_jobs.data_management import resync_narrative
from core import utils
from core.api.customer_facing.reports.utils import NarrativeUpdator
from core.constants import GLAM_NARATIVE
from core.errors import ForbiddenError
from core.graph import graph_client, make_sync_client
from core.models.ids import get_uuid
from core.models.internal_link import PORTAL_URL
from core.v4 import narrativeTemplate
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import ALL_TYPES

TITLE = "Narrative Templater"
DESCRIPTION = "Convert Narrative into a template that only your company can use."
VERSION = 1

DEFAULT_QUESTION = "## What do you call ?"

DEFAULT_ADDITIONAL_CONTEXT = "\n".join(
    [
        "## When should you fill in this section?",
        "This is the most important section where the customer will get the real information on what the template does.",
        "\n",
        "<br>" "\n",
        "## Ideas for this section",
        " - Add helper information on each question",
        " - Add the value of the Narrative",
        " - Add expectations of the Narratives" " - Or add a video on how you should explain the Narrative",
        "\n",
        "<br>",
        "\n",
        "# First time? Watch this!!!",
        "::video[Example Video]{id=9b14c988a7764e9d99c1c4745a352207  width=600}",
    ]
)

UNIQUE_MAPPER_KEYS = dict(activity="activity_id", feature="new_feature_id", word="word")

REMOVE_QUESTION_KEYS = (
    "activity_id",
    "feature_id",
    "word",
    "details",
    "field_input",
    "time_input",
    "dropdown_input",
    "narrative_input",
    "field_input",
    "feature_name",
    "question_help",
    "slug",
)


def get_schema(mavis: Mavis, internal_cache: dict):
    is_loaded = internal_cache["template_name"]
    narrative_slug = internal_cache["narrative_slug"]

    # get all the narratives
    all_templates = list(
        set(
            t.name
            for t in graph_client.get_all_internal_templates(company_id=mavis.company.id).narrative_template
            if t.global_version == 5
        )
    )

    # load the Narratives
    if is_loaded:
        templates = graph_client.get_template_by_name(name=internal_cache["template_name"]).narrative_template

        valid_narratives = []
        if len(templates) > 0:
            valid_narratives = [
                dict(slug=n.slug, name=n.name)
                for t in templates
                for n in t.narratives
                if n.company.id == mavis.company.id and n.narrative_runs
            ]

        if not valid_narratives:
            valid_narratives = [
                dict(slug=n.slug, name=n.name)
                for n in make_sync_client(mavis.user.token).narrative_index(company_id=mavis.company.id).narrative
            ]

        # get all the cascade options
        all_cascade = _get_cascade_template(mavis, templates, narrative_slug)
    else:
        valid_narratives = []
        all_cascade = []

    # define the full schema
    schema = _object(
        dict(
            template_name=_drop_down(all_templates, title="Template Name"),
            # add the actions
            delete=_checkbox("Delete"),
            save=_checkbox("save"),
            # Context
            template_context=_input(),
            top_side_pannel=_object(
                dict(
                    release_to_customer=_checkbox("Release to Users"),
                    # TODO: Add a remove from production
                )
            ),
            # Add the question template
            template_question=_input("Template Question"),
            template_description=_input("Template Description"),
            # Reprocess the narrative
            cascade_update=_drop_down(
                all_cascade,
                "value",
                "label",
                is_multi=True,
                title="Cascade to all Narratives Using this Template",
            ),
            cascade_all=_checkbox("Cascade to all Narratives"),
            # The Narrative based on the behavior
            narrative_slug=_drop_down(valid_narratives, "slug", "name", title="Narrative"),
            # add the key information
            additional_context=_input(default=DEFAULT_ADDITIONAL_CONTEXT, title="Context"),
            right_context=_object(
                dict(
                    load_preview=_checkbox("Refresh Preview"),
                    additional_context_preview=_input(default=DEFAULT_ADDITIONAL_CONTEXT),
                )
            ),
            # List all questions
            questions=_make_array(
                dict(
                    left=_object(
                        dict(
                            # questions
                            question=_input("Question", default=DEFAULT_QUESTION),
                            default_answer=_input("Default Answer"),
                            allowed_types=_drop_down(ALL_TYPES, is_multi=True, title="Allowed Types"),
                            requires_revenue=_checkbox("Requires Revenue"),
                            # Add the kind
                            # kind=_drop_down(['word', 'equation'], title='Kind'),
                            # equation_input=_drop_down([], title="equation"),
                            word=_input("Desired Word to Replace"),
                            run=_checkbox("Show help"),
                            answer_kind=_drop_down(
                                [
                                    "free_text",
                                    "dropdown",
                                    "time_resolution",
                                    "narratives",
                                ],
                                default="free_text",
                                title="Type of Answer",
                            ),
                        )
                    ),
                    question_help=_input(),
                ),
                title="Template Questions",
            ),
        )
    )

    _hide_properties(schema, ["template_question", "template_description"], "add_template_question")
    _hide_properties(schema, ["cascade_update", "cascade_all"], "cascade_to_previous_users")

    # create the question to make it simpler
    question_obj = schema["properties"]["questions"]["items"]["properties"]["left"]

    _hide_properties(
        question_obj,
        ["allowed_types"],
        "show_types",
        ["requires_revenue"],
    )

    _hide_properties(
        question_obj,
        ["requres_revenue", "allowed_types", "show_types"],
        "is_question",
        ["word", "answer_kind", "run"],
    )

    # add the drop down to be dependent on the answer kind
    _add_dependency(
        question_obj,
        "answer_kind",
        "dropdown",
        dict(
            dropdown_options=_drop_down([], is_multi=True, title="Dropdown Options"),
        ),
    )
    _add_dependency(
        question_obj,
        "answer_kind",
        "free_text",
        dict(
            add_inflection=_checkbox("Replace Inflections"),
        ),
    )

    # for Narratives and Time Resolution it should be fine

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_submit=True,
                hide_output=True,
                flex_direction="row",
                flex_wrap="wrap",
            ),
            order=[
                "template_name",
                "delete",
                "save",
                # Add all the context
                "template_context",
                "top_side_pannel",
                # start showing the input options
                "narrative_slug",
                # Hidden Options
                "add_template_question",
                "template_question",
                "template_description",
                "cascade_to_previous_users",
                "cascade_update",
                "cascade_all",
                # Add the real context
                "additional_context",
                "right_context",
                # add the questions
                "questions",
            ],
        ),
        template_name=_make_ui(
            options=dict(
                size="large",
                allows_new_items=True,
                process_data=True,
                update_schema=True,
                **_space(60 if is_loaded else 90),
            ),
            help_text="DO NOT CHANGE!!! This is what Narrator uses as a unique identifier.",
        ),
        delete=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="secondary",
                danger=True,
                tiny=True,
                popconfirm=True,
                popconfirm_text="Are you sure you want to delete the Template? This will delete all the versions available",
                **_space(10, mb=20, inline_button=True),
            ),
        ),
        save=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="primary",
                **_space(30, mb=20, align_right=True),
            ),
        ),
        # add the details
        template_context=_make_ui(widget="MarkdownRenderWidget", options=_space(70)),
        top_side_pannel=dict(
            **_make_ui(options=dict(title=False, **_space(30))),
            release_to_customer=_make_ui(help_text="This version will be the version that customers now use"),
            in_free_tier=_make_ui(
                help_text="Everyone will have access to this template, no need to add template_slug to their account"
            ),
            # template_used_by=_make_ui(),
        ),
        # pick the Narrative
        narrative_slug=_make_ui(
            options=dict(process_data=True, update_schema=True, **_space(100)),
        ),
        # Template Hide
        add_template_question=_make_ui(widget="BooleanToggleWidget"),
        template_question=_make_ui(
            help_text="If this is filled, then we will use this instead of the name in the user dropdown."
        ),
        # Cascade
        cascade_to_previous_users=_make_ui(widget="BooleanToggleWidget"),
        cascade_update=_make_ui(options=dict(**_space(80))),
        cascade_all=_make_ui(
            options=dict(process_data=True, **_space(20)),
        ),
        # add All the context for the customer to understand what is happeing
        additional_context=_make_ui(
            widget="MarkdownWidget",
            options=dict(default_height=400, **_space(50)),
        ),
        right_context=dict(
            **_make_ui(
                widget="MarkdownRenderWidget",
                options=dict(title=False, **_space(50)),
            ),
            load_preview=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    process_data=True,
                    button_type="secondary",
                    **_space(align_right=True),
                ),
            ),
            additional_context_preview=_make_ui(widget="MarkdownRenderWidget"),
        ),
        questions=dict(
            items=dict(
                **_make_ui(order=["left", "question_help"]),
                left=dict(
                    **_make_ui(
                        order=[
                            "is_question",
                            "question",
                            "show_types",
                            "allowed_types",
                            "requires_revenue",
                            "word",
                            "answer_kind",
                            "dropdown_options",
                            "add_inflection",
                            "default_answer",
                            "run",
                        ],
                        options=dict(title=False, **_space(40)),
                    ),
                    is_question=_make_ui(hidden=True),
                    word=_make_ui(options=_space(60)),
                    show_types=_make_ui(hidden=True),
                    allowed_types=_make_ui(disabled=True),
                    question=_make_ui(widget="MarkdownWidget", options=dict(default_height=200)),
                    answer_kind=_make_ui(options=_space(40)),
                    run=_make_ui(
                        widget="BooleanButtonWidget",
                        options=dict(
                            process_data=True,
                            button_type="secondary",
                            **_space(90, align_right=True),
                        ),
                    ),
                ),
                question_help=_make_ui(widget="MarkdownRenderWidget", options=_space(60)),
            )
        ),
    )

    # remove everything until the user picks something
    if not internal_cache["template_name"]:
        schema["properties"] = {k: v for k, v in schema["properties"].items() if k == "template_name"}

    # remove everything until the user picks something
    if not internal_cache["narrative_slug"]:
        schema["properties"] = {
            k: v
            for k, v in schema["properties"].items()
            if k
            in (
                "template_name",
                "delete",
                "save",
                "template_context",
                "top_side_pannel",
                "narrative_slug",
            )
        }

    return (schema, schema_ui)


def _update_questions_with_previous_narrative_answers(questions, narrative):
    # reinput the answers from the narrative
    answered_questions = {q["id"]: q for q in narrative.get("questions") or []}

    # fill in the values
    for q in questions:
        if answered_questions.get(q["id"]):
            ans = answered_questions[q["id"]]
            # copy over the answers form the narrative
            if q["kind"] == "word" and not q.get("word"):
                q["word"] = ans.get("word", "MISSING THE WORD USED")
                q["left"]["word"] = ans.get("word", "MISSING THE WORD USED")
            elif q["kind"] == "activity" and ans.get("activity_id"):
                q["activity_id"] = ans["activity_id"]
                q["activity_name"] = ans["activity_name"]
            elif q["kind"] == "feature" and ans.get("new_feature_id"):
                q["new_feature_id"] = ans["new_feature_id"]
                q["feature_name"] = ans.get("feature_name")

        # if we don't have the word then what is going on
        elif q["kind"] == "word" and not q.get("word"):
            q["word"] = "No Saved Answer"


def _get_narrative(mavis, nar_slug):
    narrative_updator = NarrativeUpdator(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(nar_slug)
    narrative = narrative_updator.get_config(narrative_id)

    nar_obj = (
        make_sync_client(mavis.user.token)
        .get_narrative_by_slug(slug=nar_slug, company_id=mavis.company.id)
        .narrative[0]
    )

    # save some of the key pieces of the narrative to the id
    narrative["name"] = nar_obj.name
    narrative["description"] = nar_obj.description

    return (narrative, nar_obj)


def _question_to_template_mapper(questions):
    activity_mapping = dict()
    feature_mapping = dict()
    word_mapping = []

    for q in questions:
        # this will be used to figure out what to do\
        if q["kind"] == "word":
            word_mapping.append(
                narrativeTemplate.Mapping(
                    old_id=q["word"],
                    new_id=q["id"],
                    add_inflection=q["left"].get("add_inflection", False),
                )
            )
        elif q["kind"] == "feature" and q.get("new_feature_id"):
            # This is when we are loading the questions to ensure the feature that was used is being mapped to the
            # correct question
            feature_mapping[q["new_feature_id"]] = q["id"]

        elif q["kind"] == "activity":
            activity_mapping[q["activity_id"]] = q["id"]

    return (activity_mapping, feature_mapping, word_mapping)


def _remove_questions_using_unused_activities(questions, template):
    # remoave any questions that are no longer needed
    all_activity_ids = [a.old_id for a in template.activity_mapping]
    all_feature_ids = [a.old_id for d in template.datasets for a in d.feature_mapping]

    questions = [
        q
        for q in questions
        if (
            q["kind"] not in ("activity", "feature")
            or (q["kind"] == "activity" and q["activity_id"] in all_activity_ids)
            or (q["kind"] == "feature" and q.get("new_feature_id") in all_feature_ids)
        )
    ]
    return questions


def create_narrative_template(mavis, data, activities):
    # load the narrative
    (narrative, _) = _get_narrative(mavis, data["narrative_slug"])

    # update the questions with the value
    _update_questions_with_previous_narrative_answers(data["questions"], narrative)

    (activity_mapping, feature_mapping, word_mapping) = _question_to_template_mapper(data["questions"])

    # create the narrative template
    template = narrativeTemplate.create_template(
        mavis,
        narrative,
        # this is the word mapping
        word_mapping,
        [],
        activities,
        activity_mapping,
        feature_mapping,
        ignore_activities_and_features=data["template_name"] == GLAM_NARATIVE,
    )

    # clean up questions
    data["questions"] = _remove_questions_using_unused_activities(
        data["questions"],
        template,
    )

    # save the name in the object
    template.name = data["template_name"]
    template.description = data["template_description"]
    return template


def _get_ids(kind, questions):
    return {q[UNIQUE_MAPPER_KEYS[kind]]: q for q in questions if q.get("kind") == kind}


def _create_activity_question(mavis, am, dataset_objs, activity_objs):
    a_obj = activity_objs[am.old_id]

    template_actual_map = narrativeTemplate.create_activity_word_mapping(
        activity_objs, am.old_id, "", to_template=False
    )

    mapped_keys = dict(
        slug_exact="Slug",
        name="Name",
        lower_name="Name Lower Case",
        title_name="Name Title Case",
        slname="Name slugified",
        stream="Associated Stream Table",
        has_source="has Identity Resolution",
    )
    mapped_keys[""] = "Id"

    activity_question = dict(
        id=am.old_id,
        kind="activity",
        activity_id=am.old_id,
        activity_name=a_obj.name,
        left=dict(
            is_question=True,
            question=f"## What activity would best represent {a_obj.name}?",
            default_answer=a_obj.name,
            requires_revenue=am.requires_revenue,
        ),
        question_help="\n\n".join(
            [
                f"ACTIVITY: **{a_obj.name}** is from `{a_obj.company_table.activity_stream}` table",
                "Used in the following dataset:",
                " - "
                + "\n - ".join(
                    [
                        f"[{dataset_objs[d_slug].name}]({PORTAL_URL}/{mavis.company.slug}/datasets/edit/{d_slug})"
                        for d_slug in am.dataset_slugs
                    ]
                ),
                "<br>",
                "<details><summary> Exact Replacements</summary>",
                ", ".join(
                    [f"{tm.new_id} ({mapped_keys.get(tm.old_id[1:]) or tm.old_id})" for tm in template_actual_map]
                ),
                "</details>",
                "<br>",
                "<details><summary> Helpful Tips</summary>",
                " - Consider updating the question to give more context on how the user will pick it",
                " - If this activity can have Identity resolution, make sure you are templating and activity with Identity Resolution",
                " - If is used in multiple datasets but you want the user to pick different options, change the activity",
                " - Narrator will auto guess an activity to use based on the best fuzzy match of all the comma delimited default answer.  For example ( if you enter `order,session,purchase` we will look to see if any activity is really close to the word order and if yes, default to that, if no, look for sesison)",
                " - If the activity has a revenue column and you are not using that column then remove it from the dataset"
                "</details>",
            ]
        ),
    )

    return activity_question


def _create_feature_question(mavis, fm, d_object):
    wm = narrativeTemplate.add_word(
        fm.display_name,
        "",
        add_inflection=True,
        to_template=True,
    )

    feature_question = dict(
        id=narrativeTemplate.__mess_id(fm.old_id),
        feature_id=fm.old_id,
        new_feature_id=fm.old_id,
        kind="feature",
        left=dict(
            is_question=True,
            allowed_types=fm.allowed_types,
            show_types=True,
            question=f"## What feature would best represent {fm.display_name} in dataset {d_object.name}?",
            default_answer=fm.display_name,
        ),
        question_help="\n\n".join(
            [
                f"FEATURE **{fm.display_name}** from [{d_object.name}]({PORTAL_URL}/{mavis.company.slug}/datasets/edit/{d_object.slug})",
                "The feature will be removed from the dataset!",
                "<details><summary> Exact Replacements</summary>",
                ", ".join(set(w.old_id for w in wm)),
                "</details>",
                "<br>",
                "<details><summary> Helpful Tips</summary>",
                " - The user will be able to pick any column from any activity in the dataset, customer attribute or enrichment",
                "- If you want to change the allowed types then you need to update the dataset because a dependency is limiting the type"
                "</details>",
            ]
        ),
    )

    return feature_question


def _update_word_question(q):
    wm = narrativeTemplate.add_word(
        q["left"]["word"],
        "",
        add_inflection=False,
        to_template=True,
    )
    basic_replace = {sw.old_id for sw in wm}

    inflection_replace = {
        w.old_id
        for w in narrativeTemplate.add_word(
            q["left"]["word"],
            "",
            add_inflection=True,
            to_template=True,
        )
        if w.old_id not in basic_replace
    }

    # new word seen
    q.update(
        id=q.get("id", get_uuid()),
        word=q["left"]["word"],
        kind="word",
        question_help="\n\n".join(
            [
                "By default, the following words will be replaced (after activity and features) from the Narrative and dataset:",
                ", ".join(basic_replace),
                "<br>",
                "<details><summary> If you have `Replace Inflections` checked</summary>",
                " With Inflections we will also remove:",
                ", ".join(inflection_replace),
                "</details>",
                "<details><summary> If you have answer Kind as `Time Resolution`</summary>",
                " We will show the user a dropdown of month, day, week, hour, etc..",
                "</details>",
                "<details><summary> If you have answer Kind as `Dropdown`</summary>",
                " We will show the user a dropdown of the inputs that you put in",
                "</details>",
                "<details><summary> If you have answer Kind as `Narrative`</summary>",
                " You must enter the word as the narrative slug and we will replace the slug with the new slug",
                "</details>",
            ]
        ),
    )


def _clean_question(q):
    new_q = dict()
    for k, v in q.items():
        if k not in REMOVE_QUESTION_KEYS:
            new_q[k] = v

        if k == "left":
            new_q["left"] = _clean_question(v)
    return new_q


def create_questions(mavis, data, activities):
    for q in data.get("questions") or []:
        # add an id if it is missing one
        if not q["id"]:
            q["id"] = get_uuid()

    # create the template
    template = create_narrative_template(mavis, data, activities)

    questions = data["questions"] if data.get("questions") else []
    dataset_objs = {
        td.slug: td
        for td in graph_client.get_datasets_by_slug(
            company_id=mavis.company.id, slugs=[d.slug for d in template.datasets]
        ).dataset
    }

    added_activities = _get_ids("activity", questions)
    added_features = _get_ids("feature", questions)

    # add the activities
    for am in template.activity_mapping:
        temp_act = _create_activity_question(mavis, am, dataset_objs, activities)

        if added_activities.get(am.old_id):
            added_activities[am.old_id]["question_help"] = temp_act["question_help"]

            # DEPRECATED THIS LINE
            added_activities[am.old_id]["left"]["requires_revenue"] = am.requires_revenue

        else:
            questions.append(temp_act)

    # add the features
    for d in template.datasets:
        for f in d.feature_mapping:
            temp_feature = _create_feature_question(mavis, f, dataset_objs[d.slug])

            if added_features.get(f.old_id):
                added_features[f.old_id]["question_help"] = temp_feature["question_help"]

                # DEPRECATED THIS LINE
                added_features[f.old_id]["left"]["show_types"] = True
                added_features[f.old_id]["left"]["allowed_types"] = f.allowed_types

            else:
                questions.append(temp_feature)

    for q in questions:
        if q.get("word") == "word" or q["left"].get("word"):
            _update_word_question(q)

    # add the questiosn needed
    data["questions"] = questions

    # save uthe questions without their inputs
    template.questions = [_clean_question(q) for q in questions]
    return template


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["template_name"] = data["template_name"]
    internal["narrative_slug"] = data["narrative_slug"]
    return internal


# get the values that are allowed
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    values = []

    if updated_field_slug and updated_field_slug.endswith("field_input") and data.get("narrative_slug"):
        narrative_updator = NarrativeUpdator(mavis=mavis)
        narrative_id = narrative_updator._slug_to_id(data["narrative_slug"])
        narrative = narrative_updator.get_config(narrative_id)
        values = [dict(value=f["name"], label=f["name"]) for f in narrative["field_configs"]]

    elif updated_field_slug in ("root_narrative_slug", "root_cascade_update"):
        if data["template_name"]:
            templates = graph_client.get_template_by_name(name=data["template_name"]).narrative_template

            # only try to got the values if it is available
            if updated_field_slug == "root_narrative_slug":
                if len(templates) == 0:
                    values = [
                        dict(value=n.slug, label=n.name)
                        for n in graph_client.narrative_index(company_id=mavis.company.id).narrative
                    ]
                else:
                    values = [
                        dict(value=n.slug, label=n.name)
                        for t in templates
                        for n in t.narratives
                        if n.company.id == mavis.company.id
                    ]

            else:
                # get all the template data
                for t in templates:
                    for nar in t.narratives:
                        # deal with the different data sources
                        if updated_field_slug == "root_cascade_update":
                            # don't allow updating the same narrative
                            if nar.slug == data["narrative_slug"] and nar.company.id == mavis.company.id:
                                continue

                            # create the key because it will be used to cascade the narrative
                            key = f"{nar.company.id},{nar.slug}"

                        elif nar.company.id == mavis.company.id:
                            key = nar.slug
                        else:
                            continue

                        # append the values
                        values.append(
                            dict(
                                value=key,
                                label="{} ({}) - {}".format(
                                    nar.name,
                                    nar.company.name,
                                    utils.pretty_diff(nar.updated_at, utils.utcnow()),
                                ),
                            )
                        )

    return dict(values=values)


def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    if updated_field_slug == "root_right_context_load_preview":
        data["right_context"]["additional_context_preview"] = data["additional_context"]

    elif updated_field_slug.startswith("root_questions") and updated_field_slug.endswith("run"):
        # update the data
        _update_word_question(data["questions"][-1])

        return data

    elif updated_field_slug == "root_cascade_all":
        # cascade the updates
        if data["cascade_all"]:
            templates = graph_client.get_template_by_name(name=data["template_name"]).narrative_template
            values = _get_cascade_template(mavis, templates, data["narrative_slug"])
            data["cascade_update"] = [v["value"] for v in values["values"]]
        else:
            data["cascade_update"] = []

    elif updated_field_slug == "root_delete":
        # reset the data
        if not mavis.user.is_internal_admin:
            raise ForbiddenError("Only super Admins can delete Narratives")

        # Delete the template
        if data["template_name"]:
            graph_client.delete_template_by_name(name=data["template_name"])
        return dict()

    elif updated_field_slug == "root_template_name":
        data = utils.dict_to_rec_dd(dict(template_name=data["template_name"]))

        # get all the details of the narrative
        templates = [
            t
            for t in graph_client.get_internal_template_by_name(
                name=data["template_name"], company_id=mavis.company.id
            ).narrative_template
            if len(t.narratives) > 0
        ]

        try:
            _get_template_details(mavis, templates, data)
        except Exception as e:
            data["template_context"] = f"# ERROR: \n\n{utils.get_error_message(e)}"
            return data

    # check if the narrativ slug is real
    if not data.get("narrative_slug"):
        if data["last_template"]:
            data["_notification"] = utils.Notification(
                message="Not a valid company for updating this template",
                description="There is no Narrative that points to this template so you cannot update this Narrative",
                type=utils.NotificationTypeEnum.ERROR,
            )
        return data

    # The below will run for everything!!
    # create the activities
    activities = {a.id: a for a in graph_client.activity_index_w_columns(company_id=mavis.company.id).all_activities}

    template = create_questions(mavis, data, activities)

    if updated_field_slug == "root_save":
        _save_template(mavis, template, data, activities)

        # reset the data
        data = process_data(mavis, data, "root_template_name")

        # save the data
        data["_notification"] = utils.Notification(
            message="Updated the Template", type=utils.NotificationTypeEnum.SUCCESS
        )

    return data


def _get_template_details(mavis, templates, data, idx=0):
    context = []
    if len(templates) > 0:
        lt = templates[idx]
        created_by = graph_client.get_user(id=lt.created_by).user_by_pk
        context.extend(
            [
                f"V{lt.global_version} - {lt.customer_iteration}.{lt.local_iteration}",
                f"Written by: {created_by.email if created_by else 'Cannot find user'}",
                f"Template used {mavis.human_format(sum(len(tt.narratives) for tt in templates))} *(This version {mavis.human_format(len(lt.narratives))})*",
            ]
        )

        # alert on name
        if lt.global_version != 5:
            raise ValueError(
                "The template name is already used for the older version of templates, so please choose a new name"
            )

        # store the template object
        data["last_template"] = lt.dict()

        # copy over some key values
        data["template_question"] = lt.question
        data["template_description"] = lt.description
        data["top_side_pannel"]["template_used_by"] = lt.display_companies_using
        data["top_side_pannel"]["in_free_tier"] = lt.in_free_tier

        # TODO: DEPRECATE
        data["template_kind"] = lt.narrative_template_kind.value

        # Process all the questions
        template_obj = graph_client.get_template(id=lt.id).narrative_template_by_pk

        # create the template object
        template = narrativeTemplate.Template(**json.loads(template_obj.template))

        data["questions"] = template.questions
        data["additional_context"] = template.additional_context or None
        data["right_context"]["additional_context_preview"] = data["additional_context"]

        # add all historical
        context.append("<details><summary>Past Narratives </summary>")

        # let the user know the last narratives and companies that used it
        found = False
        for ii, t in enumerate(templates):
            if ii == 0:
                for n in t.narratives:
                    if not n.narrative_runs:
                        continue

                    if n.company.id == mavis.company.id and not found:
                        data["narrative_slug"] = n.slug
                        context.insert(
                            0,
                            f"## Narrative Used: [{n.name}]({PORTAL_URL}/{n.company.slug}/narratives/a/{n.slug}) \n\n<br>",
                        )
                        found = True

                    context.append(
                        f" 1. V{t.customer_iteration}.{t.local_iteration} [{n.name}]({PORTAL_URL}/{n.company.slug}/narratives/a/{n.slug}) - {n.company.name} *updated {utils.pretty_diff(n.updated_at)}*"
                    )

            n = t.narratives[0]
            context.append(
                f" 1. V{t.customer_iteration}.{t.local_iteration} [{n.name}]({PORTAL_URL}/{n.company.slug}/narratives/a/{n.slug}) - {n.company.name} *updated {utils.pretty_diff(n.updated_at)}*"
            )

        context.append("</details>")

    else:
        data["last_template"] = None
        context.extend(
            [
                "## Lets create a new template",
                "Choose the Narrative that you want to templatize below",
            ]
        )

    # Save the context
    data["template_context"] = "\n\n".join(context)


def _save_template(mavis: Mavis, template, data, activities):
    # update all references (swap old_id with the new_id)
    narrativeTemplate.prepare_template(template, data["additional_context"])

    # remove the data
    template.narrative.pop("questions", None)

    # figure out the version and state:
    if data.get("last_template"):
        customer_i = data["last_template"]["customer_iteration"]
        local_i = data["last_template"]["local_iteration"]
    else:
        customer_i = 0
        local_i = 0

    # Save the template ignore activities and feature
    template.ignore_activities_and_features = data["template_name"] == GLAM_NARATIVE

    # move the iteration forward for the customers
    new_local_i = 0 if data["top_side_pannel"]["release_to_customer"] else local_i + 1
    new_customer_i = (customer_i + 1) if data["top_side_pannel"]["release_to_customer"] else customer_i

    # Create the Narrative in
    template_id = graph_client.insert_narrative_template(
        name=data["template_name"],
        global_version=5,
        local_iteration=new_local_i,
        customer_iteration=new_customer_i,
        in_free_tier=data["top_side_pannel"]["in_free_tier"] or False,
        question=data["template_question"] or None,
        description=data["template_description"] or None,
        # TODO: Deprecate state
        kind="generic",
        state="published_globally",
        display_company_using=data["top_side_pannel"]["template_used_by"] or 0,
        # if not created by then just make it Ahmed (used for local testing)
        created_by=mavis.user.id,
        template=template.json(),
        company_id=mavis.company.id,
    ).insert_narrative_template_one.id

    # Give access to just this customer

    # add the answers to the questions
    question_objects = data["questions"]
    for q in question_objects:
        # we later own replace the word with different options so we will save the input to the narrative
        if q.get("word"):
            q["dropdown_input"] = q["word"]
            q["time_input"] = q["word"]
            q["narrative_input"] = q["word"]

        if q["kind"] == "feature":
            # if new feature_id was not there then add it
            q["new_feature_id"] = q.get("new_feature_id") or q["id"].replace("$", "")

        q["question"] = q["left"]["question"]

        # remove all the keys
        q.pop("question_help", None)
        q.pop("left", None)

    # attach the questions onto the template
    narrative_updator = NarrativeUpdator(mavis=mavis)
    narrative = narrative_updator.get_config(data["narrative_slug"])
    narrative["questions"] = question_objects
    narrative_updator.update_config(data["narrative_slug"], narrative)

    # update the narrative with the template id
    graph_client.update_narrative_with_template(
        company_id=mavis.company.id,
        slug=data["narrative_slug"],
        template_id=template_id,
    )

    for cascade_nar in data["cascade_update"]:
        (company_slug, narrative_slug) = cascade_nar.split(",")
        resync_narrative.send(
            company_slug=company_slug,
            narrative_slug=narrative_slug,
            template_id=template_id,
        )

    # update the local iteration
    if data["last_template"]:
        data["last_template"]["customer_iteration"] = new_customer_i
        data["last_template"]["local_iteration"] = new_local_i


def _get_cascade_template(mavis: Mavis, templates, narrative_slug):
    values = []
    # get all the template data
    for t in templates:
        for nar in t.narratives:
            # don't allow updating the same narrative
            if nar.slug == narrative_slug and nar.company.id == mavis.company.id:
                continue

            # create the key because it will be used to cascade the narrative
            key = f"{nar.company.slug},{nar.slug}"

            # append the values
            values.append(
                dict(
                    value=key,
                    label=f"{nar.name} ({nar.company.name}) - {utils.pretty_diff(nar.updated_at, utils.utcnow())}",
                )
            )

    return values


def run_data(mavis: Mavis, data: dict):
    return None
