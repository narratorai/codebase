from fastapi import APIRouter, Depends

from core import utils
from core.api.auth import get_current_user, get_mavis
from core.api.customer_facing.datasets.utils import DatasetManager
from core.errors import SilenceError
from core.graph import graph_client, make_sync_client
from core.models.user import AuthenticatedUser
from core.v4 import createDataset
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

from .models import (
    AllShortcuts,
    ColumnShortcut,
    DatasetDefinitionInput,
    DatasetInputColumns,
    DatasetObject,
    GroupInput,
    RowShortcut,
    SpendDetails,
    SpendInput,
    SwapGroupInput,
    TranslateOutput,
)

router = APIRouter(prefix="/dataset/create", tags=["dataset"])


@router.get("/activity_columns", response_model=DatasetInputColumns)
async def get_activity_columns(
    activity_ids: str,
    relationship: createDataset.RelationshipEnum = None,
    include_customer: bool = False,
    stream_table: str = None,
    cohort_activity_ids: str = None,
    cohort_occurrence: str = None,
    index: int = None,
    mavis: Mavis = Depends(get_mavis),
):
    """Return the columns for an Append activity."""
    activity_ids = activity_ids.split(",")

    # make sure we deal with time filters
    is_time = utils.is_time(activity_ids[0])

    if is_time:
        activities = dict()
    else:
        activities = {a.id: a for a in graph_client.get_activities_w_columns(ids=activity_ids).activities}

        if stream_table is None and not is_time:
            stream_table = mavis.company.table(activities[activity_ids[0]].table_id).activity_stream

    res = dict(
        **createDataset.get_activity_columns(
            mavis,
            activity_ids,
            relationship,
            include_customer,
            stream_table,
            activities=activities,
            include_values=True,
            cohort_occurrence=cohort_occurrence,
            cohort_activity_ids=(cohort_activity_ids.split(",") if cohort_activity_ids else None),
            index=index,
        ),
        raw_columns=createDataset.get_activity_columns(
            mavis,
            activity_ids,
            None,
            include_customer,
            stream_table,
            activities=activities,
            include_values=True,
        )["all_columns"],
    )
    return res


@router.post("/convert_definition", response_model=createDataset.PlanExecution)
async def convert_definition(input: DatasetDefinitionInput, mavis: Mavis = Depends(get_mavis)):
    """Take the definitions object and returns the dataset object."""
    # CHECK TO MAKE SURE NO INSANE LAST BEFORE IS HAPPENING
    if input.dataset_config.cohort.occurrence_filter.occurrence == createDataset.OccurrenceEnum.ALL:
        for a in input.dataset_config.append_activities:
            if (
                a.relationship_slug == createDataset.RelationshipEnum.LAST_BEFORE
                and len(a.time_filters) == 0
                and len(a.column_filters) == 0
            ):
                # get if the activity has too many rows
                activity_row_count = graph_client.get_activity_rows(id=a.activity_ids[0]).activity_by_pk

                # if the Activities are more than 10m rows then alert the user
                if activity_row_count.row_count and activity_row_count.row_count > 10**7:
                    raise SilenceError(
                        f"We noticed you are using an append activity ({activity_row_count.name}) with `Last Before` and you have removed the time window filter. The activity used has more than 10M rows so this can be a very costly query. Please add a time window filter to constraint the data",
                        code="last_before_no_time_filter",
                    )

    res = createDataset.generate_dataset_obj(mavis, input.dataset_config)

    # HACK: Added this to fix UI bug
    input.dataset["query"]["activities"] = [a for a in input.dataset["query"]["activities"] if a]

    # copy the fields over
    res["staged_dataset"]["fields"] = input.dataset.get("fields")
    d_obj = res["staged_dataset"]["query"]
    activity_obj = d_obj["activities"][0]

    # if it is time use the next activity
    if utils.is_time(activity_obj["activity_ids"][0]):
        if len(d_obj["activities"]) > 1:
            activity_obj = d_obj["activities"][1]
        else:
            activity_obj = None

    # reconcile the dataset if needed
    if input.dataset and len(input.dataset["query"]["activities"]) > 0:
        res = createDataset.diff_dataset(Dataset(mavis, obj=input.dataset), res["staged_dataset"])

    # if new then check if the data is too large and notify the user and apply filter
    elif activity_obj and mavis.company.dataset_row_threshold:
        ct = mavis.company.table(activity_obj["config"]["activity_stream"])

        if mavis.company.warehouse_language == "bigquery" and not ct.manually_partition_activity:
            # get if the activity has too many rows
            activity_row_count = next(
                (
                    t.row_count
                    for t in mavis.company.tables
                    if t.activity_stream == activity_obj["config"]["activity_stream"]
                ),
                None,
            )
        else:
            # get if the activity has too many rows
            activity_row_count = graph_client.get_activity_rows(
                id=activity_obj["activity_ids"][0]
            ).activity_by_pk.row_count

        # check if the activity we are using in the cohort is really large (let NULL mean I don't know)
        if activity_row_count and activity_row_count > mavis.company.dataset_row_threshold * 10**6:
            ts_col = next(
                c
                for c in d_obj["columns"]
                if c["name"] == "ts" and c["source_details"].get("activity_kind") == "limiting"
            )

            # if there is no filter on the ts then add a time filters
            if ts_col and len(ts_col["filters"]) == 0:
                # add a filter 3 months ago to make this easy
                ts_col["filters"].append(
                    dict(
                        operator="time_range",
                        from_type="relative",
                        from_value_kind="value",
                        from_value=mavis.company.dataset_default_filter_days or 30,
                        from_value_resolution="day",
                        to_type="now",
                    )
                )

                # let the user know we added a time filter
                res["ui_instructions"] = [
                    dict(
                        kind=createDataset.UIKindEnum.PUSH_NOTIFICATION,
                        notification=utils.Notification(
                            type=utils.NotificationTypeEnum.INFO,
                            duration=4,
                            message="Data is large - Auto adding time filter",
                            description=f"You have a really big Stream so to save processing we by default add a filter for {mavis.company.dataset_default_filter_days} days which you can remove if you would like.",
                        ),
                    )
                ]
    return res


def _explain_filter(column_name, filter, cl=None, is_filt=False):
    words = []
    if is_filt:
        words.append(" filter")
    else:
        words.append(" but only if")

    words.append(column_name)

    if filter["operator"] == "time_range":
        words.append(_explain_column_time_filter(filter, "from"))
        words.append(_explain_column_time_filter(filter, "to"))

    elif filter["operator"] == "quick_time_filter":
        words.append(filter["value"].replace("_", " "))

    else:
        words.append(filter["operator"].replace("_", " "))

        if filter.get("value"):
            if filter.get("kind") == "column_id" and cl:
                words.append("column")
                words.append(cl[filter["value"]])
            else:
                words.append(str(filter["value"]))

    if filter.get("or_null"):
        words.append("or is null")

    words.append(filter["operator"])
    words.append(filter["value"])

    return " ".join(words)


def _explain_column_time_filter(filter, prefix):
    words = [prefix]
    if filter[prefix + "_type"] == "relative":
        words.append(f'{filter[prefix + "_value"]} {filter[prefix + "_value_resolution"]} ago')
    elif filter[prefix + "_type"] == "absolute":
        words.append(f'{filter[prefix + "_value"]}')
    elif filter[prefix + "_type"] == "now":
        words.append("now")
    elif filter[prefix + "_type"] == "colloquial":
        words.append(f'{filter[prefix + "_value"]}')

    return " ".join(words)


def _explain_time_filter(filter):
    if filter.get("type") == "relative":
        if int(filter["from_value"]) < 0:
            return f' from now to {filter["from_value"]} {filter["segmentation"]} in the future'
        else:
            return f' for the last {filter["from_value"]} {filter["segmentation"]} to now'

    elif filter["type"] == "absolute":
        return f' from {filter["from_date"]} to now'


@router.post("/translate", response_model=TranslateOutput)
async def translate_config(
    input: DatasetDefinitionInput,
    mavis: Mavis = Depends(get_mavis),
):
    return dict(details=_translate_config(mavis, input.dataset_config))


def _translate_config(mavis, dataset_config: createDataset.DatasetConfig) -> str:
    details = []

    cohort = dataset_config.cohort
    append = dataset_config.append_activities

    # get all the activity ids
    activity_ids = []
    activity_ids.extend(cohort.activity_ids)
    for a in append:
        activity_ids.extend(a.activity_ids)

    user_graph = make_sync_client(mavis.user.token)

    # get the activities
    activity_obj = {a.id: a for a in user_graph.get_basic_activities(ids=activity_ids).activities}

    c_occ = cohort.occurrence_filter.occurrence

    if c_occ != c_occ.TIME:
        c_name = " or ".join([activity_obj[a_id].name for a_id in cohort.activity_ids])
        but_only_if = " and ".join(
            [_explain_filter(c.activity_column.label, c.filter.dict()) for c in cohort.column_filters]
        )
    else:
        c_name = utils.title(cohort.activity_ids[0])
        but_only_if = _explain_time_filter(cohort.occurrence_filter.resolution_filter)

    # add some helper functions
    is_customer = c_occ not in (
        c_occ.ALL,
        c_occ.TIME,
    )

    is_time = c_occ == c_occ.TIME

    cohort_time = ""
    # translate the cohort
    if c_occ == c_occ.FIRST:
        cohort_time = "first"
        cohort_text = (
            f"For each customer who did {c_name}{but_only_if} and for the features use the **first** time they did it"
        )

    elif c_occ == c_occ.LAST:
        cohort_time = "last"
        cohort_text = (
            f"For each customer who did {c_name}{but_only_if} and for the features use the **last** time they did it"
        )

    elif c_occ == c_occ.CUSTOM:
        cohort_time = cohort.occurrence_filter.custom_value
        cohort_text = f"For each customer who did {c_name}{but_only_if} and for the features use the **{cohort.custom_value}** time they did it."

    elif c_occ == c_occ.ALL:
        cohort_text = f"Give me **all times** customers did {c_name}{but_only_if}"

    elif c_occ == c_occ.TIME:
        cohort_text = f"Give me every {c_name}{but_only_if}"
    else:
        cohort_text = ""

    details.append(cohort_text)

    for a in append:
        # get the append names
        a_name = " or ".join([activity_obj[a_id].name for a_id in a.activity_ids])
        but_only_if = " and ".join(
            [_explain_filter(c.activity_column.label, c.filter.dict()) for c in a.column_filters]
        )

        # In Between is the same as after for customer
        if is_customer and a.relationship_slug.value.endswith("_in_between"):
            a.relationship_slug = createDataset.RelationshipEnum(
                a.relationship_slug.value.replace("_in_between", "_after")
            )

        if is_customer:
            append_text = "For each customer"

            # add the column selection
            if a.relationship_slug.value.startswith("agg"):
                append_text += f" apply an aggregation on all the times that customer did **{a_name}{but_only_if}**"
            elif a.relationship_slug.value.startswith("first"):
                append_text += f" add features from the **first** time that customer did **{a_name}{but_only_if}**"
            else:
                append_text += f" add features from the **last** time that customer did **{a_name}{but_only_if}**"

            if a.relationship_slug.value.endswith("ever"):
                append_text += " over their entire lifetime"
            elif a.relationship_slug.value.endswith("after"):
                append_text += f"after the {cohort_time} {c_name}"
            elif a.relationship_slug.value.endswith("before"):
                append_text += f" before the {cohort_time} {c_name}"
            elif a.relationship_slug.value.endswith("in_between"):
                append_text += f" after the {cohort_time} {c_name}"

        elif is_time:
            append_text = f"For each **{c_name}** add every customer"

            # add the column selection
            if a.relationship_slug.value.startswith("agg"):
                append_text += f" apply an aggregation on all the times that customer did **{a_name}{but_only_if}**"
            elif a.relationship_slug.value.startswith("first"):
                append_text += f" add features from the **first** time a customer **{a_name}{but_only_if}**"
            else:
                append_text += f" add features from the **last** time a customer **{a_name}{but_only_if}**"

            if a.relationship_slug.value.endswith("ever"):
                append_text += " over their entire lifetime"
            elif a.relationship_slug.value.endswith("after"):
                append_text += f" after that instance of {c_name}"
            elif a.relationship_slug.value.endswith("before"):
                append_text += f" before that instance of {c_name}"
            elif a.relationship_slug.value.endswith("in_between"):
                append_text += f" after that instance of {c_name} but before that customer does {c_name} again"

        else:
            # FOR ALL
            append_text = f"For each time a customer did **{c_name}**"

            # add the column selection
            if a.relationship_slug.value.startswith("agg"):
                append_text += f" apply an aggregation on all the times that customer did **{a_name}{but_only_if}**"
            elif a.relationship_slug.value.startswith("first"):
                append_text += f" add features from the **first** time that customer does **{a_name}{but_only_if}**"
            else:
                append_text += f" add features from the **last** time a customer does **{a_name}{but_only_if}**"

            if a.relationship_slug.value.endswith("ever"):
                append_text += " over their entire lifetime"
            elif a.relationship_slug.value.endswith("after"):
                append_text += f" after that instance of {c_name}"
            elif a.relationship_slug.value.endswith("before"):
                append_text += f" before that instance of {c_name}"
            elif a.relationship_slug.value.endswith("in_between"):
                append_text += f" after that instance of {c_name} but before that customer does {c_name} again"

        details.append(append_text)

    return "\n".join(details)


@router.post("/reconcile", response_model=createDataset.PlanExecution)
async def reconcile(
    input: createDataset.PlanExecutionInput,
    dataset_slug=None,
    mavis: Mavis = Depends(get_mavis),
):
    """Take the definitions object and returns the dataset object."""
    # if your adding a group column then reset order
    if input.plan and (
        (
            input.plan[-1].mutation == createDataset.MutationEnum.ADD
            and input.plan[-1].column_kind == createDataset.ColumnKindEnum.GROUP
        )
        or (
            input.plan[-1].mutation == createDataset.MutationEnum.DELETE
            and input.plan[-1].column.get("column_kind") == "group"
        )
    ):
        input.plan.append(createDataset.EditAction(mutation="add_order", group_slug=input.plan[-1].group_slug))

    res = createDataset._update_plan(
        Dataset(mavis, obj=input.dataset),
        input.plan,
        ui_instructions=input.ui_instructions,
    )
    res["ui_instructions"] = None
    return res


@router.post("/make_definition", response_model=DatasetDefinitionInput)
async def make_definition(
    input: DatasetObject,
    dataset_slug=None,
    mavis: Mavis = Depends(get_mavis),
):
    """Take the definitions object and returns the dataset object."""
    if dataset_slug:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(dataset_slug)
    else:
        dataset_id = None

    dataset = Dataset(mavis, id=dataset_id, obj=input.dataset)

    return dict(dataset_config=createDataset.make_definition(dataset))


@router.post("/add_group", response_model=createDataset.PlanExecution)
async def add_group(
    input: GroupInput,
    mavis: Mavis = Depends(get_mavis),
):
    """Add a group to a dataset. It will add all the columns you need."""
    return createDataset.add_group(
        Dataset(mavis, obj=input.dataset),
        input.column_ids,
        time_window=input.time_window,
    )


@router.post("/swap_group_column", response_model=createDataset.PlanExecution)
async def swap_group_column(
    input: SwapGroupInput,
    mavis: Mavis = Depends(get_mavis),
):
    """Swap a group column in dataset."""
    return createDataset.swap_group_by(
        Dataset(mavis, obj=input.dataset),
        input.group_slug,
        input.column,
        input.new_column_id,
    )


@router.get("/column_shortcuts", response_model=list[createDataset.ColumnShortcut])
async def get_column_shortcuts(mavis: Mavis = Depends(get_mavis)):
    """Return the shortcuts for the column right click."""
    return createDataset.get_column_shortcuts(mavis)


@router.post("/apply_column_shortcut", response_model=createDataset.PlanExecution)
async def apply_column_shortcut(
    input: ColumnShortcut,
    mavis: Mavis = Depends(get_mavis),
):
    """Add the columns for group tab based on the script landing."""
    return createDataset.apply_column_shortcut(
        Dataset(mavis, obj=input.dataset),
        input.group_slug,
        input.column,
        input.shortcut_key,
        input.shortcut_option,
    )


@router.get("/all_shortcuts", response_model=AllShortcuts)
async def get_all_shortcuts(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Return the shortcuts for the column right click."""
    return dict(
        column_shortcuts=createDataset.get_column_shortcuts(),
        row_shortcuts=createDataset.get_row_shortcuts(),
    )


@router.post("/apply_row_shortcut", response_model=createDataset.PlanExecution)
async def apply_row_shortcut(
    input: RowShortcut,
    mavis: Mavis = Depends(get_mavis),
):
    """Add the columns for group tab based on the script landing."""
    return createDataset.apply_row_shortcut(
        Dataset(mavis, obj=input.dataset),
        input.group_slug,
        input.row,
        input.selected_column_id,
        input.shortcut_key,
        input.shortcut_column_id,
    )


@router.post("/add_spend", response_model=createDataset.PlanExecution)
async def add_spend(
    input: SpendDetails,
    mavis: Mavis = Depends(get_mavis),
):
    """Add the columns for group tab based on the script landing."""
    if input.is_remove:
        return createDataset.update_spend(Dataset(mavis, obj=input.dataset), input.group_slug)
    elif input.spend_config and input.spend_config.metrics:
        return createDataset.update_spend(Dataset(mavis, obj=input.dataset), input.group_slug, input.spend_config)


@router.post("/get_spend_options", response_model=createDataset.SpendOptions)
async def get_spend_options(
    input: SpendInput,
    mavis: Mavis = Depends(get_mavis),
):
    return createDataset.get_spend_options(Dataset(mavis, obj=input.dataset), input.group_slug, input_table=input.table)
