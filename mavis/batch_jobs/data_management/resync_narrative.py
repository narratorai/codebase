import json

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.reports.utils import NarrativeManager
from core.api.v1.endpoints.narrative_template import swap_template_dataset
from core.decorators import mutex_task, with_mavis
from core.errors import SilenceError
from core.graph import graph_client
from core.v4 import narrativeTemplate
from core.v4.analysisGenerator import assemble_narrative
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis


@mutex_task(queue_name="narratives")
@with_mavis
def resync_narrative(mavis: Mavis, template_id: str, narrative_slug: str, **kwargs):
    # grab the current Narrative
    narrative_updator = NarrativeManager(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(narrative_slug)
    narrative = narrative_updator.get_config(narrative_id)
    questions = narrative.get("questions", [])
    answered_questions = {q["id"]: q for q in questions}

    # Get the template
    template_obj = graph_client.get_template(id=template_id).narrative_template_by_pk

    # create the template object
    template = narrativeTemplate.Template(**json.loads(template_obj.template))

    # fill in the values
    for q in template.questions:
        if not answered_questions.get(q["id"]):
            if q.get("default_answer"):
                q["word"] = q["default_answer"] or "no answer"
                answered_questions[q["id"]] = q
            else:
                # TODO: Just raising an error now but may want to try and fill in the value
                question = q["question"]
                raise SilenceError(f"Could not find an answer to question '{question}'")

        # copy over the answers form the narrative
        if q["kind"] == "word":
            q["word"] = answered_questions[q["id"]].get("word", "NO ANSWER")
        elif q["kind"] == "activity":
            q["activity_id"] = answered_questions[q["id"]]["activity_id"]
        elif q["kind"] == "feature":
            q["feature_id"] = answered_questions[q["id"]]["feature_id"]

    # activity_mapping
    activity_mapping = {q["id"]: q["activity_id"] for q in template.questions if q["kind"] == "activity"}

    # word_mapping
    word_mapping = {q["id"]: q["word"] for q in template.questions if q["kind"] == "word"}
    # feature_mapping
    feature_mapping = {
        q["id"]: q.get("new_feature_id", q["feature_id"]) for q in template.questions if q["kind"] == "feature"
    }

    # find all the dataset slugs
    d_slugs = []
    dataset_narrative_objs = utils.recursive_find(narrative, narrativeTemplate.DATASET_KEYS, True)
    for k, d in dataset_narrative_objs:
        if d[k] not in d_slugs:
            d_slugs.append(d[k])

    if len(template.datasets) != len(d_slugs):
        raise SilenceError("The datasets have changed so cannot keep trying")

    # Update all the narrative to point on the new datasets
    for ii, d in enumerate(template.datasets):
        # get the dataset slug
        dataset_updator = DatasetManager(mavis=mavis)
        dataset_id = dataset_updator._slug_to_id(d_slugs[ii])
        dataset_obj = Dataset(mavis, dataset_id)

        # swap the datasets
        swap_template_dataset(
            mavis,
            dataset_obj,
            d.dataset,
            remove_group_slug=answered_questions.get("6dc455f2_1759_43cf_a169_2d45ace24b46") is None,
        )

        # TODO: deal with removing group by tab for time to convert
        d.mapping.new_id = d_slugs[ii]

    # Also map the question id to the template
    # The old_id  is always q["id"] and the new id is the input
    narrativeTemplate.update_template_with_values(mavis, template, activity_mapping, word_mapping, feature_mapping)

    # handle the field
    for q in questions:
        if q["kind"] == "field_input":
            for f in template.narrative["field_configs"]:
                if f["kind"] == "value_field" and q["id"] == f["name"] and q.get("word"):
                    f["value"]["content"] = q["word"]

    # save the copy of the narrative
    copy_slug = narrative_slug + utils.utcnow()
    narrative_updator.update_config(copy_slug, narrative)
    template.narrative["last_slug"] = copy_slug
    template.narrative["questions"] = questions

    # remove duplicated columns
    # THIS IS A HACK
    # For some reason the update_template_with_values ends up causing columns to duplicate when resyncing this is caused
    # by the way I pass objects by reference and manipulate them (which is critical to how narrative templates work so
    # DO NOT CHANGE THAT)
    # After hours with no idea why the duplication happens, I decided to handle it here.
    for d in template.datasets:
        cols = d.dataset["query"]["columns"]
        d.dataset["query"]["columns"] = [
            c for ii, c in enumerate(cols) if c["id"] not in (tc["id"] for tc in cols[:ii])
        ]

    # saved the narrative
    narrativeTemplate.create_narrative(mavis, template, add_to_graph=False, narrative_slug=narrative_slug)

    # point the narrative to the new NArrative
    graph_client.update_narrative_with_template(
        company_id=mavis.company.id, slug=narrative_slug, template_id=template_id
    )

    # assemble the Narrative
    assemble_narrative(mavis, narrative_slug)
