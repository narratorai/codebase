from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core import utils
from core.api.auth import get_mavis
from core.api.customer_facing.datasets.utils import DatasetManager
from core.constants import (
    ANALYZE_BUTTON_FT_URL,
    GLAM_NARATIVE_V2,
    TIME_TO_CONVERT_GROUP_V2,
)
from core.graph import graph_client
from core.logger import get_logger
from core.models.ids import get_uuid
from core.models.internal_link import InternalLink
from core.util.tracking import fivetran_track
from core.utils import DatasetInput
from core.v4 import createDataset, narrativeTemplate
from core.v4.blocks.use_narrative_template_v5 import process_data as process_data_v5
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import RESOLUTIONS

logger = get_logger()

router = APIRouter(prefix="/narrative/template", tags=["narrative"])


class FeatureInput(BaseModel):
    template: narrativeTemplate.Template
    feature_id: str
    activity_mapping: list[narrativeTemplate.Mapping] | None
    word_mapping: list[narrativeTemplate.Mapping] | None


class CreateInput(BaseModel):
    narrative_name: str
    template: narrativeTemplate.Template
    activity_mapping: list[narrativeTemplate.Mapping] | None
    word_mapping: list[narrativeTemplate.Mapping] | None
    feature_mapping: list[narrativeTemplate.Mapping] | None


class SavedFiles(BaseModel):
    narrative_slug: str
    dataset_slugs: list[str]


class DropdownValue(BaseModel):
    value: str
    label: str


class NarrativeGLAMTemplate(BaseModel):
    feature_label: str | None
    feature_id: str | None
    kpi_id: str | None
    kpi_label: str | None
    kpi_format: str | None

    # TODO: MAke ENUMs
    time_resolution: str = "month"
    impact_direction: str = "increase"
    time_option_id: str | None
    row_name: str | None
    is_test: bool = False

    feature_ids: list[str] | None
    feature_labels: list[str] | None
    metric_id: str | None


class DatasetNarrativeInput(NarrativeGLAMTemplate):
    dataset: DatasetInput


class DatasetMetricOutput(BaseModel):
    markdown: str
    metric_id: str


class DatasetNarrativeOptions(BaseModel):
    features: list[DropdownValue]
    kpis: list[DropdownValue]
    kpi_formats: list[str]
    time_to_convert_options: list[DropdownValue]
    row_name: str


class DatasetNarrativeOutput(BaseModel):
    markdown: str
    narrative_slug: str
    dataset_slug: str
    dataset_name: str
    narrative_name: str


class DebugInput(BaseModel):
    narrative_slug: str
    dataset_slug: str
    time_resolution: str = "month"
    kpi_label: str | None


class DebugOutput(BaseModel):
    markdown: str
    open_helpscout: bool = False
    helpscout_message: str | None


@router.post("/get_feature_values", response_model=list[DropdownValue])
async def get_feature_values(input: FeatureInput, mavis: Mavis = Depends(get_mavis)):
    """Get the values of the columns in the data."""
    return narrativeTemplate.get_valid_columns(
        mavis,
        input.template,
        input.feature_id,
        {a.old_id: dict(old_id=a.old_id, activity_id=a.new_id) for a in input.activity_mapping or []},
        {a.old_id: dict(old_id=a.old_id, word=a.new_id) for a in input.word_mapping or []},
    )


@router.post("/create", response_model=SavedFiles)
async def create_input(input: CreateInput, preview: bool = False, mavis: Mavis = Depends(get_mavis)):
    """Return the autocomplete."""
    narrativeTemplate.update_template_with_values(
        mavis,
        input.template,
        {a.old_id: dict(old_id=a.old_id, activity_id=a.new_id) for a in input.activity_mapping or []},
        {a.old_id: dict(old_id=a.old_id, word=a.new_id) for a in input.word_mapping or []},
        {a.old_id: dict(old_id=a.old_id, feature=a.new_id) for a in input.feature_mapping or []},
    )

    return narrativeTemplate.create_narrative(
        mavis,
        input.template,
        add_to_graph=not preview,
        narrative_slug=(utils.slugify(input.narrative_name + get_uuid()[-8:]) if not preview else None),
    )


@router.post("/get_column_options", response_model=DatasetNarrativeOptions)
async def get_narrative_input_options(
    input: DatasetNarrativeInput,
    dataset_slug: str | None = None,
    is_metric: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    """Get all the column options."""
    if dataset_slug:
        dataset = Dataset(mavis, dataset_slug)
        input.dataset = DatasetInput(**dataset.obj)
    else:
        dataset = Dataset(mavis, obj=input.dataset.dict())

    columns = dataset.ds.get_all_columns(dataset.query)

    features = [
        dict(value=c["id"], label=c["label"])
        for c in columns
        if (
            c.get("name")
            not in (
                "ts",
                "activity_id",
                "customer",
                "source_id",
                "anonymous_customer_id",
                "join_customer",
            )
            or c["source_details"].get("activity_kind") != "limiting"
        )
        and c.get("type") not in ("timestamp")
    ]
    time_to_convert_options = [
        dict(value=c["id"], label=c["label"])
        for c in columns
        if (
            utils.get_simple_type(c["type"]) == "number"
            and (
                (c["source_kind"] == "computed" and c["source_details"].get("activity_kind") != "append")
                or any(r in c["label"].lower() for r in RESOLUTIONS)
            )
        )
    ]

    # compute the kpis
    kpis = {}
    REMOVE_FUNCS = ("sum", "count", "count_distinct", "min", "max", "stddev", "rate")

    # add the columns
    for c in dataset.obj["query"]["columns"]:
        for group_func in c.get("group_func") or []:
            # deal with the group fun format
            group_func, _ = createDataset._get_format(group_func)
            if is_metric or group_func.split(".")[0].lower() not in REMOVE_FUNCS:
                kpis[f'{group_func}.{c["id"]}'] = createDataset._group_column_name(c, group_func)

    for af in createDataset.ALL_AGG_FUNCTIONS.values():
        # skip these functions
        if not is_metric and af["name"] in REMOVE_FUNCS:
            continue

        for c in columns:
            # only include the agg functions that work
            if (
                len(af["input_fields"]) > 0
                and utils.get_simple_type(c["type"]) in af["input_fields"][0]["data"]
                and utils.get_simple_type(mavis.qm.get_output_type(af, c)) == "number"
            ):
                kpis[f'{af["name"]}.{c["id"]}'] = createDataset._group_column_name(c, af["name"])

    kpis = [dict(value=k, label=v) for k, v in kpis.items()]

    # get the kpi format
    kpi_formats = [_guess_format(k) for k in kpis]

    cohort_activity = next(
        (a for a in dataset.obj["query"]["activities"] if a["kind"] == "limiting" and a["occurrence"] != "time"),
        None,
    )

    # add better alerts for the error
    if cohort_activity is None:
        raise ValueError("Cannot use a time cohort as a KPI because it cannot be optimized.")

    # create a smarter row name
    if cohort_activity["occurrence"] != "all":
        row_name = next(
            t.identifier or "Customer"
            for t in mavis.company.tables
            if t.activity_stream == cohort_activity["config"]["activity_stream"]
        )
    elif utils.is_or_activity(cohort_activity.get("slug")):
        row_name = "An Action"
    else:
        row_name = cohort_activity.get("name") or utils.title(utils.slug_path(cohort_activity.get("slug")))

    return dict(
        features=features,
        kpis=kpis,
        kpi_formats=kpi_formats,
        time_to_convert_options=time_to_convert_options,
        row_name=row_name,
    )


def _guess_format(k):
    f = utils.guess_format(k["label"], "number")
    return "number" if f == "id" else f


@router.post("/create_dataset_narrative", response_model=DatasetNarrativeOutput)
async def create_dataset_narrative(
    input: DatasetNarrativeInput,
    mavis: Mavis = Depends(get_mavis),
):
    """Process the narrative."""
    return run_narrative_glam_template(mavis, input.dataset.dict(), input)


def run_narrative_glam_template(
    mavis: Mavis,
    dataset_obj,
    narrative_input: NarrativeGLAMTemplate,
    override_name=None,
):
    template_versions = graph_client.get_all_template_versions(name=GLAM_NARATIVE_V2).narrative_template

    # create the version that you want
    template_id = next(
        (
            t.id
            for t in template_versions
            if t.local_iteration == 0
            # and mavis.user.email not in ("brittany@narrator.ai", "ahmed@narrator.ai")
        ),
        template_versions[0].id,
    )
    data = dict(
        template_name=GLAM_NARATIVE_V2,
        template_id=template_id,
        step_flow=dict(current=0),
        is_test=narrative_input.is_test,
        questions=[],
    )

    dataset = Dataset(mavis, obj=dataset_obj)
    query_obj = dataset.query

    cm = {c["id"]: c for c in dataset.ds.get_all_columns(query_obj)}

    additional_notes = []
    markdown_text = []
    raw_data = None

    if narrative_input.feature_ids:
        is_multi = len(narrative_input.feature_ids) > 1
        loop = zip(narrative_input.feature_ids, narrative_input.feature_labels)
    else:
        is_multi = False
        loop = zip([narrative_input.feature_id], [narrative_input.feature_label])

    for feature_id, feature_label in loop:
        feature_col = cm.get(feature_id)

        # Ensure the column has a display format
        feature_col["display_format"] = feature_col.get(
            "display_format", utils.guess_format(feature_label, feature_col["type"])
        )

        column_values = []

        # get the values
        if utils.get_simple_type(feature_col["type"]) in ("string", "number"):
            if raw_data is None:
                raw_data = dataset.run()
            column_values = raw_data.unique_column_values(raw_data.column(id=feature_id))

        if utils.get_simple_type(feature_col["type"]) in (
            "number",
            "boolean",
        ) and not createDataset._map_definitions_name(query_obj["activities"][0], feature_col).startswith("did-"):
            additional_notes.extend(
                [
                    f" - Your feature {feature_label} can have nulls for a numeric column so we filtered them out for you."
                ]
            )
            feature_col["filters"].append(dict(operator="not_is_null", kind="value", or_null=False))

            # check if there are a lot of values and decide how to decimate it
            if len(column_values) > 10:
                # find the right decimated value
                temp_values = utils.trim_values([c for c in column_values if c is not None], 0.05)
                decimate_by = abs(utils.max_values(temp_values) - utils.min_values(temp_values)) / 20

                all_int = all(float(c).is_integer() for c in temp_values)
                decimate_by = int(decimate_by)

                # make it an int always make it an int
                if all_int:
                    decimate_by = int(decimate_by)

                # Round values so they make sense
                if decimate_by < 0.5:
                    decimate_by = round(decimate_by, 2)
                elif decimate_by < 1:
                    decimate_by = round(decimate_by, 2)
                else:
                    decimate_by = int(decimate_by)

                # don't bother with 0/1 decimation
                if decimate_by not in (0, 1):
                    # create the decimated column
                    f_label = feature_col["label"]
                    feature_col["label"] = f"Raw {f_label}"
                    raw_string = f'decimate_number({feature_col["id"]}, {decimate_by})'
                    new_col = createDataset._create_computed_column(raw_string, f_label, col_type="number")
                    new_col["display_format"] = feature_col["display_format"]
                    # Add the new column and use it
                    query_obj["columns"].append(new_col)
                    feature_id = new_col["id"]
                    additional_notes.extend(
                        [
                            f" - Numerical feature has too many values, so we bucket the values by {decimate_by} for clearer visualization.",
                        ]
                    )

        elif utils.same_types(feature_col["type"], "string") and len(column_values) <= 1:
            additional_notes.extend(
                [
                    "<br>",
                    "⚠️ **In a scan of {} rows we only found 1 value for the lever and thus this will break the Narrative since it has nothing to compare it to**".format(
                        mavis.human_format(dataset.limit, "number")
                    ),
                    "Please double check the dataset to make sure this is correct",
                ]
            )

        cohort_activity = next(
            (a for a in query_obj["activities"] if a["kind"] == "limiting"),
            None,
        )

        if not cohort_activity:
            raise ValueError("Could not find an activity")

        activity_name = cohort_activity.get("name") or utils.slugify(utils.slug_path(cohort_activity.get("slug")))

        # get the kpi format
        if narrative_input.kpi_format is None:
            narrative_input.kpi_format = utils.guess_format(narrative_input.kpi_label, "number")

        # cannot have id as a format
        if narrative_input.kpi_format == "id":
            narrative_input.kpi_format = "number"

        cohort_ts_column = next(
            c
            for c in query_obj["columns"]
            if c["name"] == "ts"
            and c["source_kind"] == "activity"
            and c["source_details"].get("activity_kind") == "limiting"
        )

        # save the answers of the questions
        question_answers = {
            # ts column
            "3f64a527_cb7b_4edc_965e_ca7299207779": cohort_ts_column["id"],
            # total count column
            "2efe3bf6_a784_4232_8f05_30c83c2c1ee3": narrative_input.row_name or activity_name,
            # cohort_name
            "0eebe5fe_4104_437f_8ee0_6a3f7fc2d577": activity_name,
            # feature_id
            "421a5bc8_610b_4092_9ff3_5ef36f687c32": feature_id,
            # feature label
            "705c0fda_561e_4f8d_a8a3_f0165f422218": feature_label,
            # agg_function
            "c2c2a775_0af1_400f_8a4c_cb62b1d619ea": narrative_input.kpi_id.split(".")[-2],
            # kpi_column_id
            "c0dff146_a39b_48d4_b38d_a8609734c110": narrative_input.kpi_id.split(".")[-1],
            # Label of column used
            "dd993547_b900_4eb2_8074_bc22599a35a7": cm[narrative_input.kpi_id.split(".")[-1]]["label"],
            # kpi_label
            "d7cef771_cb6d_4c2d_823c_038f5a8aaedd": narrative_input.kpi_label,
            # Time resolution
            "357768ab_567e_431b_bf96_6fa21c923a26": narrative_input.time_resolution,
            ## FIELDS
            # impact direction
            "ea396220_ace3_4dbd_90f7_bf9e543e75dd": narrative_input.impact_direction,
            # kpi format
            "9120d7ba_9a25_4721_a49c_26f41c41d2db": narrative_input.kpi_format,
            # # feature format
            # "lever_format": utils.get_simple_type(cm[feature_id]["type"]),
            # time to convert column;
            "4a8d4d11_ce58_4d19_8f2a_5ee5a93f510e": narrative_input.time_option_id,
            # time to convert column
            "479cc366_061e_4208_b034_81e3e86770ef": (
                cm[narrative_input.time_option_id]["label"] if narrative_input.time_option_id else None
            ),
        }

        dataset = Dataset(mavis, obj=dict(query=query_obj))

        # go backwards to deal with computed columns nested dependencies
        createDataset.remove_unused_dataset(
            dataset,
            query_obj,
            [narrative_input.kpi_id.split(".")[-1]],
            keep_ids=[narrative_input.time_option_id, feature_id],
        )
        # create the template by getting the right version
        data["step_flow"]["current"] = 1
        data = process_data_v5(mavis, data, updated_field_slug="step_flow")

        # fill in QUESTIONS
        for q in data["questions"]:
            if question_answers.get(q["id"]):
                # I don't setting the time input matter since it is being set as word but why no
                if q.get("answer_kind") == "time_resolution":
                    q["time_input"] = question_answers[q["id"]]

                # save the answer to the input
                q["word"] = question_answers[q["id"]]

        data["narrative_name"] = "Impact of {feature} to {direction} {kpi}".format(
            feature=feature_label,
            kpi=narrative_input.kpi_label,
            direction=narrative_input.impact_direction,
        )
        data["override_name"] = data["narrative_name"]

        if override_name:
            data["override_name"] = override_name

        data["metric_id"] = narrative_input.metric_id

        # run the template
        data["step_flow"]["current"] = 2
        data = process_data_v5(mavis, data, updated_field_slug="step_flow")

        # fetch the data
        new_slug = data["saved_files"]["dataset_slugs"][0]
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(new_slug)
        new_dataset_obj = Dataset(mavis, dataset_id)

        new_dataset_obj.obj = swap_template_dataset(
            mavis,
            dataset_obj,
            new_dataset_obj.obj,
            remove_group_slug=narrative_input.time_option_id is None,
        )

        # check to ensure column types
        raw_column_time = {c["id"]: c for c in new_dataset_obj.obj["query"]["columns"]}

        # Cascad the types
        for g in new_dataset_obj.obj["query"]["all_groups"]:
            for gc in g["columns"]:
                if gc.get("column_id") and raw_column_time.get(gc["column_id"]):
                    for k in ("mavis_type", "type", "display_format"):
                        gc[k] = raw_column_time[gc["column_id"]].get(k)

        new_dataset_obj.update()

        if is_multi:
            markdown_text.extend(
                [
                    "# We have create {name} and started processing it 💎",
                ]
                + additional_notes
            )
            from batch_jobs.data_management.run_narrative import run_narrative

            run_narrative.send(
                company_slug=mavis.company.slug,
                slug=data["saved_files"]["narrative_slug"],
            )
        else:
            markdown_text = ["## We are preparing your analysis 💎"] + additional_notes

    if is_multi:
        markdown_text.extend(
            [
                "<br>",
                "It is processing all the narratives in batch so it will take around 5-10 minutes before it is ready.",
            ]
        )

    # track the data for Narrator to have better analytics
    fivetran_track(
        mavis.user,
        url=ANALYZE_BUTTON_FT_URL,
        data=dict(
            narrative_input.dict(),
            created_narrative_slug=data["saved_files"]["narrative_slug"],
            created_dataset_slug=data["saved_files"]["dataset_slugs"][0],
            dataset_activities=",".join([utils.slug_path(a.get("slug")) for a in query_obj["activities"]]),
            cohort_activity_name=activity_name,
            cohort_occurrence=cohort_activity["occurrence"],
            activity_stream=cohort_activity["config"]["activity_stream"],
            has_filters=any(c for c in query_obj["columns"] if len(c["filters"]) > 0),
            dataset_definition=utils.get_dataset_summary(query_obj),
        ),
    )

    return dict(
        markdown="\n\n".join(markdown_text),
        narrative_id=data["saved_files"].get("narrative_id"),
        narrative_slug=data["saved_files"]["narrative_slug"],
        dataset_slug=data["saved_files"]["dataset_slugs"][0],
        dataset_name=data["saved_files"]["dataset_names"][0],
        narrative_name=data["narrative_name"],
    )


@router.post("/debug_dataset_narrative", response_model=DebugOutput)
async def debug_dataset_narrative(input: DebugInput, mavis: Mavis = Depends(get_mavis)):
    """Process the narrative."""
    open_helpscout = False
    helpscout_message = None

    # creating the message
    markdown_text = [
        "### ⚠️ Unfortunately the analysis you are running failed",
        "We will follow some debugging for you! [Learn more here](https://docs.narrator.ai/page/debug-an-analyze-button)",
    ]

    could_not_debug = False

    try:
        # get the basic objects
        dataset = Dataset(mavis, input.dataset_slug)

        all_groups = [g["slug"] for g in dataset.obj["query"]["all_groups"]]

        for debug_kind in (
            "feature",
            "kpi_time",
            "kpi_100",
            "feature_no_longer_active",
        ):
            # check if the feature has more than one value
            if debug_kind == "feature":
                feature_group = next(g for g in all_groups if g.endswith("bb551c"))

                feature_data = dataset.run(feature_group)
                f_rows = len(feature_data.rows)

                if f_rows > 1:
                    markdown_text.extend(
                        [
                            "<br>",
                            "## ✅ Feature has multiple values",
                            "To analyze any feature we need at least 2 values to compare the groups",
                        ]
                    )
                else:
                    markdown_text.extend(
                        [
                            "<br>",
                            f"## ❌ Feature has only {f_rows} values (AFTER TIME FILTER).",
                            "Please confirm that the feature has multiple values.",
                            f"If it has multiple values, then this can be caused by the `Remove People Who can Convert` flag or a time filter. Once we remove people who can still convert, we see only {f_rows} values",
                        ]
                    )
                    break

            # check if we have enough data in time
            elif debug_kind == "kpi_time":
                kpi_time_group = next(g for g in all_groups if g.endswith("e0da3c5a"))
                kpi_time_data = dataset.run(kpi_time_group)
                has_enough_time = len(kpi_time_data.rows) > 3

                if has_enough_time:
                    markdown_text.extend(
                        [
                            "<br>",
                            "## ✅ We have enough time",
                            "We need to see at least 4 data points in time to understand a trend and ensure the impact is reliable.",
                        ]
                    )
                else:
                    markdown_text.extend(
                        [
                            "<br>",
                            "## ❌ Time is currently by the granularity of {}, but that gives us only {} data points, try a smaller granularity".format(
                                input.time_resolution, len(kpi_time_data.rows)
                            ),
                            "We need to see at least 4 data points in time to understand a trend and ensure the impact is reliable.",
                        ]
                    )
                    break

        else:
            could_not_debug = True
    except Exception:
        could_not_debug = True

    # Let the user know something happened
    if could_not_debug:
        markdown_text.append("# Something else happened so let's bring this up to support!")
        open_helpscout = True
        helpscout_message = "\n".join(
            [
                "Hey Narrator,",
                "Analyze button failed for a reason not found by the debugger.",
                f"Narrative: {InternalLink(mavis.company.slug).narrative(input.narrative_slug)}",
            ]
        )

    # Delete the narrative and dataset
    graph_client.delete_dataset_narrative(
        company_id=mavis.company.id,
        narrative_slug=input.narrative_slug,
        dataset_slug=input.dataset_slug,
    )

    markdown = "\n\n".join(markdown_text)
    return dict(
        markdown=markdown,
        open_helpscout=open_helpscout,
        helpscout_message=helpscout_message,
    )


@router.post("/create_metric", response_model=DatasetMetricOutput)
async def create_metric(input: createDataset.DatasetMetricInput, mavis: Mavis = Depends(get_mavis)):
    return createDataset._create_metric(Dataset(mavis, obj=input.dataset), input)


def swap_template_dataset(mavis: Mavis, current_dataset: dict, template_dataset: dict, remove_group_slug=False):
    # copy over the old dataset parent to the new
    template_dataset["query"]["activities"] = current_dataset["query"]["activities"]

    # add the current ids for resyncing the data so it doesn't duplicate
    current_ids = [c["id"] for c in current_dataset["query"]["columns"]]

    # create all the columns
    template_dataset["query"]["columns"] = current_dataset["query"]["columns"] + [
        c
        for c in template_dataset["query"]["columns"]
        if c["source_kind"] == "computed"
        and c["source_details"].get("activity_kind") != "append"
        and c["id"] not in current_ids
    ]

    if remove_group_slug:
        group_slug = TIME_TO_CONVERT_GROUP_V2

        template_dataset["query"]["all_groups"] = [
            g for g in template_dataset["query"]["all_groups"] if g["slug"] != group_slug
        ]

    # update the activity stream
    template_dataset["query"]["activity_stream"] = current_dataset["query"]["activities"][0]["config"][
        "activity_stream"
    ]

    return template_dataset
