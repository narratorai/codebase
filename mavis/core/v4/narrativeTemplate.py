from collections import defaultdict

from pydantic import BaseModel

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.reports.utils import NarrativeUpdator
from core.constants import DATASET_KEYS
from core.errors import SilenceError
from core.graph import graph_client
from core.models.ids import get_uuid
from core.util.opentelemetry import tracer
from core.utils import Mapping, replace_str
from core.v4 import createDataset
from core.v4.dataset_comp.query.util import Dataset
from core.v4.query_mapping.config import RESOLUTIONS

IGNORE_LIST = utils.get_stream_columns() + utils.get_spend_columns()


class FeatureMapping(Mapping):
    activity_ids: list[str] = None
    display_name: str | None
    name: str | None
    allowed_types: list[str] = None


class ActivityMapping(Mapping):
    dataset_slugs: list[str] = None
    requires_revenue: bool = False


class DatasetMapping(BaseModel):
    dataset: dict
    mapping: Mapping
    feature_mapping: list[FeatureMapping]
    added_columns: list[dict] = []
    name: str | None
    slug: str | None


class Template(BaseModel):
    narrative: dict
    activity_mapping: list[ActivityMapping]
    datasets: list[DatasetMapping]
    word_mappings: list[Mapping]
    additional_context: str | dict = None
    name: str | None
    description: str | dict = None
    id: str | None
    type: str | None
    questions: list[dict] = None
    ignore_activities_and_features: bool = False
    hide_dataset_from_index: bool = False
    # use for reference
    original_narrative_slug: str | None
    original_company_id: str | None


LOWER_WORDS = [
    "to",
    "the",
    "a",
    "an",
    "and",
    "or",
]


def _check_non_standard_column_object(c: dict):
    # is a feature column, or enrichment or customer
    not_standard = (
        (c.get("name") and c["name"].startswith("feature"))
        or (c.get("source_details") and c["source_details"].get("enrichment_table"))
        or (c.get("source_details") and c["source_details"].get("table"))
    )
    return not_standard


@tracer.start_as_current_span("create_dataset_mapping")
def create_dataset_mapping(
    mavis, d_obj: dict, new_activity_id: dict, new_feature_id: dict
) -> (list[ActivityMapping], list[FeatureMapping], list[dict]):
    """
    START THE PROCESS OF SWAPPING OUT THE ACTIVITIES
    Get the activity_id and add it to the mapping
    Get any feature of the activity and add it to the mapping
    remove all other features
    output is
    """
    activity_obj_mapping = {a["id"]: a["activity_ids"] for a in d_obj["query"]["activities"]}

    dataset = Dataset(mavis=mavis, obj=d_obj).ds
    # get all the activities
    activity_mapping = [
        ActivityMapping(old_id=a, new_id=new_activity_id.get(a)) for a in dataset._get_activity_ids(d_obj["query"])
    ]

    # find all the features that will need to be replaced
    feature_mapping = []
    added_columns = []

    # get all the columns that have some dependence on them
    for c in d_obj["query"]["columns"]:
        # check if it is a non-standard column
        if _check_non_standard_column_object(c):
            # check to see if anything is using that column
            dependents = dataset._get_all_column_ids(d_obj, only_id=c["id"], return_col=True)

            # if something is using that column figure out what types can it be and then add it to mapping then remove it from dataset
            if len(dependents) > 0:
                feature_mapping.append(
                    FeatureMapping(
                        old_id=c["id"],
                        new_id=new_feature_id.get(c["id"], __mess_id(c["id"])),
                        activity_ids=activity_obj_mapping[c["source_details"]["activity_id"]],
                        display_name=c["label"],
                        name=(c["name"].removeprefix("feature_") if c.get("name") else None),
                        allowed_types=dataset._get_valid_types(dependents, c["id"]),
                    )
                )
                added_columns.append(c)

            # delete the column from the dataset (we will later on add it when the user selects the new  column)
            dataset.remove_column(d_obj["query"], c["id"])

    return (activity_mapping, feature_mapping, added_columns)


def add_word(input_word, new_id, add_inflection=True, to_template=True):
    current_mappings = []

    from_id = "new_id" if to_template else "old_id"
    to_id = "old_id" if to_template else "new_id"

    inflections = {"": input_word}

    locs = (
        "m",
        "r",
        "n",
        "",
    )
    kinds = ("", "word", "slug", "title", "caps", "lower", "mix")

    if add_inflection:
        inflections.update(utils.get_all_inflections(input_word))

    # go through and create the combination of proper slugs
    for k, v in inflections.items():
        for kind in kinds:
            for loc in locs:
                # # don't add the double
                if k == "" and kind == "" and loc == "":
                    continue

                key_parts = (
                    new_id,
                    k,
                    loc,
                    kind,
                )
                key = "_".join([t for t in key_parts if t != ""])

                word = v
                if kind == "slug":
                    word = utils.slugify(word)
                elif kind == "title":
                    word = utils.title(word)
                elif kind == "plural":
                    word = utils.plural(word)
                elif kind == "lower":
                    word = word.lower()
                elif kind == "caps":
                    word = word.upper()
                elif kind == "mix":
                    word = " ".join(
                        [(w.lower() if w.lower() in LOWER_WORDS else w) for w in utils.title(word).split(" ")]
                    )

                # choose the kind
                ex = " " if kind != "slug" else "_"

                # add pieces before and after to deal with
                if loc == "m":
                    word = ex + word
                elif loc == "r":
                    word = word + ex
                elif loc == "n":
                    word = utils.pronoun(word)

                # add the word
                current_mappings.append(Mapping(**{from_id: key, to_id: word}))

        # '_plural', 'lower', 'p_title' are misising from above
        # TODO: Deprecate
        if not to_template:
            current_mappings.extend(
                [
                    Mapping(**{from_id: new_id + "_plural", to_id: utils.plural(input_word)}),
                    Mapping(**{from_id: new_id + "_lower", to_id: input_word.lower()}),
                    Mapping(
                        **{
                            from_id: new_id + "_p_title",
                            to_id: utils.title(utils.plural(input_word)),
                        }
                    ),
                ]
            )
    return current_mappings


def create_activity_word_mapping(activities, activity_id, random_id, to_template=True):
    to_id = "new_id" if to_template else "old_id"
    from_id = "old_id" if to_template else "new_id"

    # stem all the words
    words = [w for w in activities[activity_id].name.split()][::-1]

    # add the activity noun to the inflections
    activity_noun = next((w for w in words if utils.get_inflection(w, "NN")), words[0])

    am = [
        Mapping(
            **{
                from_id: activities[activity_id].slug,
                to_id: random_id + "_slug_exact",
            }
        ),
        Mapping(
            **{
                from_id: utils.slugify(activities[activity_id].name),
                to_id: random_id + "_slname",
            }
        ),
        Mapping(**{from_id: activities[activity_id].name, to_id: random_id + "_name"}),
        Mapping(
            **{
                from_id: activities[activity_id].name.lower(),
                to_id: random_id + "_lower_name",
            }
        ),
        Mapping(
            **{
                from_id: utils.title(activities[activity_id].name),
                to_id: random_id + "_title_name",
            }
        ),
        Mapping(
            **{
                from_id: " ".join(
                    [
                        (w.lower() if w.lower() in LOWER_WORDS else w)
                        for w in utils.title(activities[activity_id].name).split(" ")
                    ]
                ),
                to_id: random_id + "_mix_name",
            }
        ),
        Mapping(**{from_id: activity_id, to_id: random_id}),
    ]
    am.extend(add_word(activity_noun, random_id + "_noun", True, to_template))

    if not to_template:
        am.extend(
            [
                Mapping(
                    **{
                        from_id: activities[activity_id].company_table.activity_stream,
                        to_id: random_id + "_stream",
                    }
                ),
                Mapping(
                    **{
                        from_id: str(
                            "anonymous_customer_id"
                            in [c.name for c in activities[activity_id].column_renames if c.has_data]
                        ),
                        to_id: random_id + "_has_source",
                    }
                ),
            ]
        )
    return am


@tracer.start_as_current_span("create_template")
def create_template(
    mavis,
    narrative: dict,
    variabled_words: list[Mapping],
    replace_words: list[Mapping],
    activities,
    new_activity_id,
    new_feature_id,
    replace_variables=True,
    ignore_activities_and_features=False,
) -> Template:
    # remove the input fields before processing the template
    narrative.pop("input_fields", None)

    # define the building blocks
    datasets = []
    activity_mapping = []

    # create the references
    dataset_references = defaultdict(list)
    all_mappings_to_replace = []

    # get all the datasets
    dataset_narrative_objs = utils.recursive_find(narrative, DATASET_KEYS, True)

    # add all the object in to an array
    # we do this cause one dataset can be used by multiple pieces
    for k, d in dataset_narrative_objs:
        d["_key"] = k
        # add the slug of the dataset to the list
        # we will use this later to update the dataset with the UUIDStr (pass by reference)
        dataset_references[d[k]].append(d)

    dataset_names = {
        td.slug: td.name
        for td in graph_client.get_datasets_by_slug(
            company_id=mavis.company.id, slugs=list(dataset_references.keys())
        ).dataset
    }

    # for each dataset find the activity mapping
    for dataset_slug, all_narrative_dependencies in dataset_references.items():
        # get the object
        dataset_updator = DatasetManager(mavis=mavis)
        dataset_id = dataset_updator._slug_to_id(dataset_slug)
        d_obj = dataset_updator.get_config(dataset_id)

        # remove all unused fields
        if d_obj.get("fields"):
            d_obj["fields"] = {}

        # replace the activities with a has sources
        for a in d_obj["query"]["activities"][::-1]:
            # if it is time, then use the last activity _id
            if not utils.is_time(a["activity_ids"][0]):
                activity_id = a["activity_ids"][0]

            if replace_variables:
                a["config"]["has_source"] = f"{activity_id}_has_source"
                a["config"]["activity_stream"] = f"{activity_id}_stream"

        # add the references to the query so replacing works
        d_obj["query"]["dependents"] = all_narrative_dependencies
        d_obj["query"]["activity_stream"] = a["config"]["activity_stream"]

        # swap out the dataset_slug with a UUIDStr
        # This should now update the narrative with this UUIDStr
        new_id = "dataset_" + get_uuid()
        all_mappings_to_replace.append(Mapping(old_id=dataset_slug, new_id=new_id))
        for temp_d in all_narrative_dependencies:
            temp_d[temp_d["_key"]] = new_id

        # swap out the activities with the dataset
        (new_activity_mapping, feature_mapping, added_columns) = create_dataset_mapping(
            mavis, d_obj, new_activity_id, new_feature_id
        )

        # # this replaces all he words of the features
        # # we need this so the metrics, plots, axis of a feature use the new features
        # word_mapping.extend(new_word_mapping)

        # # add the new activity mapping
        for nm in new_activity_mapping:
            add_activity_mapping(activity_mapping, nm, dataset_slug)

        # create the dataset mapping
        datasets.append(
            dict(
                dataset=d_obj,
                mapping=dict(old_id=dataset_slug, new_id=new_id, question=None),
                feature_mapping=feature_mapping,
                added_columns=added_columns,
                name=dataset_names.get(dataset_slug),
                slug=dataset_slug,
            )
        )

    if ignore_activities_and_features:
        activity_mapping = []

    # swap out all the activity references
    for a in activity_mapping:
        all_mappings_to_replace.extend(
            create_activity_word_mapping(activities, a.old_id, a.new_id or a.old_id, to_template=True)
        )

    # add the replacing of the words
    all_mappings_to_replace.extend(replace_words)

    # add all the feature names
    for d in datasets:
        # In special cases like the Dataset Narrative we may want to ignore all the features
        if ignore_activities_and_features:
            d["feature_mapping"] = []

        for f in d["feature_mapping"]:
            all_mappings_to_replace.append(f)
            all_mappings_to_replace.extend(
                add_word(
                    f.display_name,
                    f.new_id,
                    add_inflection=True,
                    to_template=True,
                )
            )
            # Also replace the raw name
            if f.name:
                all_mappings_to_replace.extend(
                    add_word(
                        f.name,
                        f"raw_{f.new_id}",
                        add_inflection=True,
                        to_template=True,
                    )
                )

    # add all the words and all variations of the words
    for v in variabled_words:
        all_mappings_to_replace.extend(
            add_word(
                v.old_id,
                v.new_id,
                add_inflection=v.add_inflection,
                to_template=True,
            )
        )

    # add the scheam mapping
    for k in ("warehouse_schema",):
        all_mappings_to_replace.extend(add_word(getattr(mavis.company, k), k, to_template=True))

    all_mappings_to_replace = utils.order_all_words(all_mappings_to_replace)

    if replace_variables:
        # replace all the narrative and templates
        utils.recursive_update(narrative, replace_str, word_mapping=all_mappings_to_replace)

        for d in datasets:
            utils.recursive_update(d["dataset"], replace_str, word_mapping=all_mappings_to_replace)

            # updated the name
            d["name"] = utils.recursive_update(d["name"], replace_str, word_mapping=all_mappings_to_replace)

    return Template(
        narrative=narrative,
        activity_mapping=activity_mapping,
        datasets=datasets,
        word_mappings=variabled_words,
    )


@tracer.start_as_current_span("replace_all_variables")
def replace_all_variables(mavis, template: Template, activities, only_activities=False):
    all_mappings_to_replace = []
    all_mappings_to_replace.extend([d.mapping for d in template.datasets])

    # replace all the activity names
    for a in template.activity_mapping:
        # add the variables
        all_mappings_to_replace.extend(create_activity_word_mapping(activities, a.new_id, a.old_id, to_template=False))

    # add all the words and all variations of the words
    for v in template.word_mappings:
        if not only_activities:
            all_mappings_to_replace.extend(
                add_word(
                    v.new_id,
                    v.old_id,
                    add_inflection=v.add_inflection,
                    to_template=False,
                )
            )
        # keep timezones so the plots load
        elif v.new_id in RESOLUTIONS:
            all_mappings_to_replace.append(Mapping(old_id=v.old_id + "_slug", new_id=v.new_id))

    # utils.cprint("REPLACE ACTIVITY AND WORDS")

    # add the scheam mapping
    for k in ("warehouse_schema",):
        all_mappings_to_replace.extend(add_word(getattr(mavis.company, k), k, to_template=False))

    all_mappings_to_replace = utils.order_all_words(all_mappings_to_replace)

    # replace all the narrative and templates
    utils.recursive_update(template.narrative, replace_str, word_mapping=all_mappings_to_replace)

    for d in template.datasets:
        # replace all the words
        utils.recursive_update(
            d.dataset,
            replace_str,
            word_mapping=all_mappings_to_replace,
        )

        if d.name:
            d.name = utils.recursive_update(d.name, replace_str, word_mapping=all_mappings_to_replace)


def prepare_template(template: Template, additional_context=None):
    for a in template.activity_mapping:
        a.old_id = a.new_id
        a.dataset_slugs = None
        a.new_id = None

    # swap all features
    for d in template.datasets:
        d.mapping.old_id = d.mapping.new_id
        d.mapping.new_id = None
        d.slug = None

        d.added_columns = []
        for f in d.feature_mapping:
            f.old_id = f.new_id
            f.display_name = None
            f.name = None
            f.activity_ids = None
            f.new_id = None

    # update all the words
    for w in template.word_mappings:
        w.old_id = w.new_id
        w.new_id = None

    template.narrative.pop("input_fields", None)

    template.additional_context = additional_context or ""


@tracer.start_as_current_span("create_narrative")
def create_narrative(
    mavis,
    filled_template: Template,
    add_to_graph=False,
    narrative_slug=None,
    narrative_type="analysis",
    metric_id=None,
    override_name=None,
    hide_dataset=True,
    locked=True,
):
    if not narrative_slug:
        narrative_slug = "narrative_" + get_uuid()

    # create new ids
    for s in filled_template.narrative["narrative"]["sections"]:
        for c in s["content"]:
            c["id"] = c.get("id", get_uuid())

    # add a unique identifier to the keytakeways as well
    for k in filled_template.narrative["narrative"]["key_takeaways"]:
        k["id"] = k.get("id", get_uuid())

    # upload the Narrative
    narrative_updator = NarrativeUpdator(mavis=mavis)
    dataset_updator = DatasetManager(mavis=mavis)
    narrative_id = None

    if add_to_graph:
        narrative_name = filled_template.narrative.get("name") or filled_template.name
        narrative_description = filled_template.narrative.get("description") or filled_template.description
        narrative_id = graph_client.insert_narrative(
            company_id=mavis.company.id,
            created_by=mavis.user.id,
            updated_by=mavis.user.id,
            name=override_name or narrative_name,
            template_id=filled_template.id,
            slug=narrative_slug,
            state="in_progress",
            description=narrative_description or "",
            type=narrative_type or "analysis",
            metric_id=metric_id,
        ).insert_narrative_one.id
        narrative_updator.update_config(narrative_id, filled_template.narrative)
    # upload the dataset
    dataset_slugs = []
    dataset_names = []
    dataset_ids = []

    for d in filled_template.datasets:
        # add the columns that user wantes
        d.dataset["query"]["columns"].extend(d.added_columns)

        d.dataset["query"]["activity_stream"] = d.dataset["query"]["activities"][0]["config"]["activity_stream"]

        # HACK TO FIGURE OUT THE AGGREGATE TABLE
        agg_dims = None
        activit_stream = mavis.company.table(d.dataset["query"]["activity_stream"])
        for g in d.dataset["query"]["all_groups"]:
            spend_cols = g["spend"]["columns"] if g.get("spend") and g["spend"].get("columns") is not None else []
            if spend_cols and g.get("spend"):
                if agg_dims is None:
                    agg_dims = graph_client.get_company_table_aggregation_w_columns(
                        table_id=activit_stream.id
                    ).company_table_aggregation_dim

                if len(agg_dims) == 0:
                    raise SilenceError(
                        f"The stream {activit_stream.activity_stream} requires an aggregate table but you don't have one set yet. Please contact support for more details.",
                        code="missing_aggregate_table",
                    )

                # find the best table that matches
                desired_table = utils.pick_best_option(
                    [a.dim_table.table for a in agg_dims],
                    g["spend"].get("table", "spend"),
                )

                # Get that agg table
                agg_dim = next(
                    (d.dim_table for d in agg_dims if d.dim_table.table == desired_table),
                    None,
                )

                if agg_dim:
                    # replace the spend table
                    g["spend"]["spend_table"] = dict(
                        schema=agg_dim.schema_,
                        table=agg_dim.table,
                    )

                    # replace the joins
                    for j in g["spend"].get("joins", []):
                        j["spend_column"] = utils.pick_best_option([c.name for c in agg_dim.columns], j["spend_column"])

                    # replace the spend column
                    for c in g["spend"]["columns"]:
                        c["name"] = utils.pick_best_option([c.name for c in agg_dim.columns], c["name"])

        # upload the dataset
        if add_to_graph:
            if d.name:
                dataset_name = f"{d.name} - {narrative_name}"
            else:
                dataset_name = f"{narrative_name} Dataset"

            print("CREATING DATASET")
            dataset = dataset_updator.create(
                slug=d.mapping.new_id,
                name=dataset_name,
                description=f"Dataset Auto-generated for {narrative_name} analysis",
                hide_from_index=hide_dataset,
                locked=locked,
            )
            dataset_names.append(dataset_name)
            dataset_ids.append(dataset.id)

        dataset_id = dataset_updator._slug_to_id(d.mapping.new_id)
        dataset_updator.update_dataset_config(dataset_id, d.dataset)
        dataset_slugs.append(d.mapping.new_id)

    if narrative_id:
        graph_client.update_narrative_relations(
            narrative_id=narrative_id,
            narrative_datasets=[dict(dataset_id=d_id, narrative_id=narrative_id) for d_id in dataset_ids],
        )

    return dict(
        narrative_id=narrative_id,
        narrative_slug=narrative_slug,
        dataset_slugs=dataset_slugs,
        dataset_names=dataset_names,
    )


@tracer.start_as_current_span("get_valid_columns")
def get_valid_columns(
    mavis,
    template,
    feature_old_id,
    activity_mapping: dict,
    word_mapping: dict,
    skip_update=False,
):
    values = []
    # get the values given all the columns
    if not skip_update:
        update_template_with_values(mavis, template, activity_mapping, word_mapping)

    for d in template.datasets:
        for f in d.feature_mapping:
            if f.old_id == feature_old_id:
                desired_d = d
                desired_f = f
                break

    dataset_config = createDataset.make_definition(Dataset(mavis, obj=desired_d.dataset), include_values=False)
    values.extend(
        [
            dict(value="cohort-" + c["name"], label=c["label"])
            for c in dataset_config["cohort"]["all_columns"]
            if utils.get_simple_type(c["type"]) in desired_f.allowed_types
            # remove the columns that were already selected
            and c["name"] not in [temp_c["name"] for temp_c in dataset_config["cohort"]["columns"]]
        ]
    )
    for ii, ac in enumerate(dataset_config["append_activities"]):
        values.extend(
            [
                dict(value=f"append-{ii}-" + c["name"], label=c["label"])
                for c in ac["all_columns"]
                if utils.get_simple_type(c["type"]) in desired_f.allowed_types
                # remove the columns that were already selected
                and c["name"] not in [temp_c["name"] for temp_c in ac["columns"]]
            ]
        )
    return values


@tracer.start_as_current_span("update_template_with_values")
def update_template_with_values(
    mavis,
    template: Template,
    activity_mapping: dict,
    word_mapping: dict,
    feature_mapping: dict = None,
    activities=None,
):
    if not activities:
        # save the activities
        activities = {
            a.id: a for a in graph_client.activity_index_w_columns(company_id=mavis.company.id).all_activities
        }

    # create a new UUIDStr for all dataset
    for d in template.datasets:
        if d.mapping.new_id is None:
            d.mapping.new_id = "dataset_" + get_uuid()

    # update all the variables
    for a in template.activity_mapping:
        a.new_id = activity_mapping[a.old_id]

    # update the word mapping
    for w in template.word_mappings:
        w.new_id = word_mapping[w.old_id]

    # replace all the variables and save it
    replace_all_variables(mavis, template, activities)

    # update all the variables
    if feature_mapping:
        for d in template.datasets:
            # grab the activity object
            dataset_config = createDataset.DatasetConfig(
                **createDataset.make_definition(Dataset(mavis, obj=d.dataset), include_values=False)
            )
            temp_mapping = []

            for f in d.feature_mapping:
                col_name = feature_mapping.get(f.old_id)

                if col_name:
                    activity_objects = d.dataset["query"]["activities"]

                    if col_name.startswith("cohort-"):
                        # grab the cohort and the column
                        activity_object = next(a for a in activity_objects if a["kind"] == "limiting")
                        col = next(
                            (c for c in dataset_config.cohort.all_columns if c.name == col_name[7:]),
                            None,
                        )

                        # if you cannot find the column for any reason then just give up
                        if col is None:
                            continue

                        # generate the proper column
                        if "-" in col.name:
                            table = col.name.split("-")[0]
                            dataset_col = createDataset._create_customer_col(table, col, activity_object["id"])
                        else:
                            dataset_col = createDataset._create_column(activity_object, col)
                    else:
                        append_ii = int(col_name.split("-")[1])
                        activity_object = [a for a in activity_objects if a["kind"] != "limiting"][append_ii]

                        col = next(
                            (
                                c
                                for c in dataset_config.append_activities[append_ii].all_columns
                                if c.name == "-".join(col_name.split("-")[2:])
                            ),
                            None,
                        )
                        if col is None:
                            continue

                        dataset_col = createDataset._append_relationship_columns(activity_object, [col])[0][0]

                    # append the columns
                    d.added_columns.append(dataset_col)

                    f.new_id = dataset_col["id"]
                    f.display_name = dataset_col["label"]
                    f.name = dataset_col["name"].removeprefix("feature_") if dataset_col.get("name") else None

                    temp_mapping.append(f)
                    temp_mapping.extend(
                        add_word(
                            f.display_name,
                            f.old_id,
                            add_inflection=True,
                            to_template=False,
                        )
                    )

                    if f.name:
                        # handle bad names
                        if f.name in ("1", "2", "3"):
                            f.name = f.display_name

                        temp_mapping.extend(
                            add_word(
                                f.name,
                                f"raw_{f.old_id}",
                                add_inflection=True,
                                to_template=False,
                            )
                        )

            # update the template if you replace the object
            if len(temp_mapping):
                temp_mapping = utils.order_all_words(temp_mapping)

                utils.recursive_update(d.dataset, replace_str, word_mapping=temp_mapping)

                if d.name:
                    utils.recursive_update(d.name, replace_str, word_mapping=temp_mapping)
                utils.recursive_update(template.narrative, replace_str, word_mapping=temp_mapping)


def __mess_id(s):
    return "$".join(list(s))


def update_column_id(dataset, dataset_obj, old_id, new_id):
    # add the feature columns that we need to add
    all_references = dataset._get_all_column_ids(dataset_obj, return_col=True, only_id=old_id)
    for r in all_references:
        dataset._swap_id(r, old_id, new_id)


def add_activity_mapping(activity_mapping, new_mapping, dataset_slug):
    for a in activity_mapping:
        if new_mapping.old_id == a.old_id:
            # add the dataset
            if dataset_slug not in a.dataset_slugs:
                a.dataset_slugs.append(dataset_slug)

            a.requires_revenue = a.requires_revenue or new_mapping.requires_revenue
            break
    else:
        activity_mapping.append(
            ActivityMapping(
                old_id=new_mapping.old_id,
                new_id=new_mapping.new_id,
                dataset_slugs=[dataset_slug],
                requires_revenue=new_mapping.requires_revenue,
            )
        )
