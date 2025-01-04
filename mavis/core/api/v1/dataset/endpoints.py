from copy import deepcopy

from fastapi import APIRouter, Depends, Response

from batch_jobs.data_management.materialize_dataset import materialize_dataset
from core import utils
from core.api.auth import get_mavis
from core.api.customer_facing.companies.helpers import create_tag
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.reports.utils import NarrativeManager
from core.api.v1.customer_journey.helpers import get_customer_journey
from core.api.v1.customer_journey.models import (
    CustomerJourneyResults,
    CustomerStreamInput,
)
from core.errors import ForbiddenError, SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import status_enum
from core.logger import get_logger
from core.models.ids import UUIDStr, is_valid_uuid
from core.models.table import format_to_old
from core.util.tracking import fivetran_track
from core.utils import slugify
from core.v4.analysisGenerator import apply_dynamic_filters
from core.v4.dataset import DatasetService
from core.v4.dataset_comp.integrations.model import (
    CSVDetails,
    Materialization,
    MaterializationTypeEnum,
)
from core.v4.dataset_comp.integrations.runner import get_proccessor
from core.v4.dataset_comp.query.model import DetailKindEnum
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import FUNCTIONS

from .helpers import (
    create_column_metric,
    get_function_example,
)
from .models import (
    ComputedValidateInput,
    ComputedValidateOutput,
    DatasetAutocompleteOutput,
    DatasetCountOutput,
    DatasetCustomerJourneyInput,
    DatasetDuplicateInput,
    DatasetMetricsInput,
    DatasetOutput,
    DatasetTranslateInput,
    DatasetTranslateOutput,
    DownloadCSVDatasetOutput,
    GroupAutocomplete,
    PivotOutput,
    RunDatasetInput,
    UpdateDatasetInput,
    UpdateDatasetOutput,
)

# FIXME store these constants elsewhere!
LONG_CACHE = 60 * 6

router = APIRouter(prefix="/dataset", tags=["dataset"])
logger = get_logger()


@router.post("/translate", response_model=DatasetTranslateOutput)
async def translate_dataset(
    input: DatasetTranslateInput,
    dataset_slug: str | None = None,
    group_slug: str | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    """Translate a dataset (from slug or passed in to the body) into SQL."""

    ds = Dataset(
        mavis,
        obj=input.dataset.dict(),
    )

    # get the query
    query = ds.qm_query(group_slug, remove_unessary_columns=False, remove_limit=True)

    extra = []
    # added the real sql for postgres
    if mavis.company.warehouse_language == "pg":
        extra.extend(
            [
                "\n\n\n",
                "-- For Postgres, CTEs are materialized and thus it does not use indexes",
                "-- The actual query is below and it replaces all the ctes with the actual query",
                "\n",
                "set local enable_nestloop=off;",
            ]
        )

        extra.extend([f"-- {line}" for line in query.to_query(comment=False, nest_ctes=True).split("\n")])

    return dict(query=query.to_query(comment=True) + "\n".join(extra))


@router.post("/customer_journey", response_model=CustomerJourneyResults)
async def customer_journey(
    input: DatasetCustomerJourneyInput,
    full_journey: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    ds = Dataset(
        mavis,
        id=input.dataset_slug,
        obj=input.dataset.dict() if input.dataset else None,
    )

    activities = []
    if not full_journey:
        color_dict = dict()
        for a in ds.model.activities:
            for s in a.slugs:
                activities.append(s)
                color_dict[s] = "#513a73" if a.is_cohort else "#a71f6c"
    else:
        color_dict = dict()

    dataset_obj = ds.obj["query"]
    all_columns = ds.ds.get_all_columns(ds.obj["query"], force_uniqueness=True)
    cm = ds.ds.column_mapper

    # get the timestamp column
    timestamp_col = next(
        (
            cm[c["id"]]
            for c in all_columns
            if c["name"] == "ts" and c["output"] and c["source_details"].get("activity_kind") == "limiting"
        ),
        None,
    )
    source_id_col = next(
        (c for c in all_columns if c["name"] in ("join_customer", "anonymous_customer_id") and c["output"]),
        None,
    )
    customer_col = next(
        (cm[c["id"]] for c in all_columns if c["name"] == "customer" and c["output"]),
        None,
    )

    # use the proper activiy object
    if utils.is_time(dataset_obj["activities"][0]["activity_ids"][0]) and len(dataset_obj["activities"]) > 1:
        activity_idx = 1
    else:
        activity_idx = 0

    # deal with the null case
    if not (customer_col or source_id_col):
        raise ValueError("Row does not have a valid customer column or column is hidden")

    if not (
        (input.row.get(customer_col) if customer_col else None)
        or (input.row.get(cm[source_id_col["id"]]) if source_id_col else None)
    ):
        raise ValueError("Row has customer column but both are NULL")

    cj_input = CustomerStreamInput(
        customer_kind=("customer" if customer_col and input.row.get(customer_col) else source_id_col["name"]),
        customer=(
            input.row[customer_col]
            if customer_col and input.row.get(customer_col)
            else input.row.get(cm[source_id_col["id"]])
        ),
        timestamp=utils.make_utc(input.row.get(timestamp_col) or utils.utcnow(), mavis.company.timezone),
        asc=True,
        activities=activities,
        table=dataset_obj["activities"][activity_idx]["config"]["activity_stream"],
        limit=input.limit,
        offset=input.offset,
    )

    return get_customer_journey(mavis, cj_input, color_dict)


@router.get("/computed/autocomplete", response_model=DatasetAutocompleteOutput)
async def get_computed_autocomplete(query_language: str | None = None, mavis: Mavis = Depends(get_mavis)):
    """Create the autocomplete for freehand functions."""
    dataset = DatasetService(mavis=mavis)

    # get dataset autocomplete
    lexicon = dataset.lexicon_to_autocomplete()

    all_functions = [f for f in deepcopy(FUNCTIONS) if f["kind"] != "agg_functions"]

    timeline = graph_client.get_timeline(timeline_ids=[mavis.company.id]).company_timeline

    for ct in timeline:
        lexicon.append(
            dict(
                caption=ct.name,
                value=slugify(ct.name),
                meta=ct.description,
                kind="timeline",
                output_type="Column",
            )
        )
        # add the function
        all_functions.append(
            dict(
                name="_" + slugify(ct.name),
                display_name="_" + ct.name,
                kind="timeline",
                output_type="timestamp",
                description="Timeline Dates: " + ct.description,
                documentation="",
                input_fields=[],
            )
        )

    custom_functions = graph_client.get_all_custom_functions(company_id=mavis.company.id).custom_function

    for cf in custom_functions:
        lexicon.append(
            dict(
                caption=cf.name,
                value="_{}({})".format(
                    cf.name,
                    ", ".join("$%i" % ii for ii in range(1, cf.input_count + 1)),
                ),
                meta=cf.description,
                kind="custom",
                output_type="Column",
            )
        )

        # add the function
        all_functions.append(
            dict(
                name=f"_{cf.name}",
                display_name=f"_{cf.name}",
                kind="custom",
                output_type="column",
                description=f"CUSTOM FUNCTION: {cf.description}",
                documentation="",
                input_fields=[dict(name="input_%i" % (ii + 1), kind="column", data=[]) for ii in range(cf.input_count)],
            )
        )

    valid_functions = mavis.qm.config

    # gets all the functions
    for f in all_functions:
        if f["kind"] not in ("custom", "timeline"):
            f["sql"] = valid_functions[f["kind"]].get(f["name"])

        # add the query for the autocomplete
        f["example"] = get_function_example(f)

    # creates the object
    return dict(autocomplete=lexicon, all_functions=all_functions)


@router.post("/computed/validate", response_model=ComputedValidateOutput)
async def validate_freehand_function(
    input: ComputedValidateInput,
    dataset_slug: str | None = None,
    group_slug: str | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    """
    Take a dataset and a freehand function and test the string if it is valid.
    It also returns the SQL (might be nice to show the user).
    """
    group_func = []
    ds = Dataset(
        mavis,
        obj=input.dataset.dict(),
    )
    dataset = ds.ds
    ds.obj["query"]["freehand_string"] = input.freehand_string
    dataset_obj = ds.query
    input.freehand_string = dataset_obj["freehand_string"]

    dataset.get_all_columns(dataset_obj, group_slug=group_slug, force_uniqueness=True)

    if "None" in input.freehand_string:
        raise ValueError("We do not allow None to be used in freehand function, please another string")
    new_column = dataset.raw_string_to_col(dict(raw_string=input.freehand_string))

    # if this is a conv column then deal with it
    if input.freehand_string.startswith("is_conv"):
        col_ids = ["rate"]
        reverse_mapping = {v: k for k, v in dataset.column_mapper.items()}

        used_col = new_column.case["cases"][0]["when"].filters[0].left.table_column

        col_ids.extend(
            [
                reverse_mapping[c]
                for c in set(new_column.get_dependent_columns())
                if reverse_mapping.get(c) and c != used_col
            ]
        )

        # if not timestamps then error out
        if any(dataset.column_types[c] != "timestamp" for c in col_ids[1:]):
            raise SilenceError("\n".join(["`is_conv` requires the conditioned on columns to be of type timestamps"]))

        group_func = ["sum", ".".join(col_ids)]

    # if it is a zero and 1 column then make sure it is also has the proper group funcs
    elif new_column.kind == "case":
        valid_cols = (
            1,
            0,
            1.0,
            0.0,
        )
        if (
            all(c["then"].kind == "value" and c["then"].value in valid_cols for c in new_column.case["cases"])
            and new_column.case["else_value"].kind == "value"
            and new_column.case["else_value"].value in valid_cols
        ):
            group_func = ["average", "sum"]

    return dict(
        column_sql=new_column.to_query(),
        output_type=new_column.get_type(),
        group_func=group_func,
    )


@router.get("/config", response_model=dict)
@router.get("/get_config", response_model=dict)
async def load_dataset_config(
    slug: str,
    narrative_slug: str | None = None,
    upload_key: str | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    updator = DatasetManager(mavis=mavis)
    id = updator._slug_to_id(slug)
    updator.log_view(id)
    return get_dataset_with_narrative(mavis, slug, narrative_slug, upload_key)


def get_dataset_with_narrative(mavis, slug: str | None, narrative_slug=None, upload_key=None):
    updator = DatasetManager(mavis=mavis)
    id = updator._slug_to_id(slug)
    d_obj = updator.get_config(id)
    if d_obj is None:
        raise SilenceError("Could not find dataset")

    # add the processing of the narrative
    if narrative_slug and upload_key:
        narrative_config = NarrativeManager(mavis=mavis).get_snapshot(narrative_slug, upload_key)
        ds = Dataset(mavis, id)
        local_cache = {"_datasets": {slug: ds}}
        ds.obj["fields"] = narrative_config["fields"]
        # apply the filters
        apply_dynamic_filters(
            mavis,
            narrative_config,
            narrative_config["field_overrides"],
            local_cache,
        )

    return d_obj


@router.get("/integrations", response_model=list[dict])
async def get_dataset_integrations(slug: str, mavis: Mavis = Depends(get_mavis)):
    updator = DatasetManager(mavis=mavis)
    id = updator._slug_to_id(slug)
    materailizations = graph_client.get_dataset_materializations(dataset_id=id).materializations

    return_mats = []
    # load the materializations
    for m in materailizations:
        r = m.dict() | (updator._get_materialization(m.id) or {})
        return_mats.append(r)

    return return_mats


@router.patch("/update", response_model=UpdateDatasetOutput)
@router.post("/update", response_model=UpdateDatasetOutput)
async def update_dataset(input: UpdateDatasetInput, mavis: Mavis = Depends(get_mavis)):
    """Save the dataset."""
    completed = []
    notification = None

    dataset_updator = DatasetManager(mavis=mavis)
    new_tags = []
    for t in input.tags or []:
        if isinstance(t, dict):
            new_tags.append(t["company_tag"]["id"])
        elif is_valid_uuid(t):
            new_tags.append(t)
        else:
            # create the tag
            new_tags.append(create_tag(mavis.company.id, t).id)
    input.tags = new_tags

    if input.id is None:
        dataset = dataset_updator.create(**input.dict())
        input.id = dataset.id
        input.slug = dataset.slug
    elif input.locked:
        raise ForbiddenError("This dataset is locked so please unlock it to save it")

    dataset_updator.check_update_permissions(input.id)

    if input.status == status_enum.archived:
        dataset_updator.delete(input.id)
        return dict(
            success=True,
            dataset_id=input.id,
            dataset_slug=input.slug,
            completed=[],
            notification=utils.Notification(
                message="Deleted Dataset",
                description="The dataset has been deleted",
                type=utils.NotificationTypeEnum.SUCCESS,
            ),
        )

    else:
        dataset_updator.update(**input.dict())
        graph_client.update_datasetstatus(id=input.id, status=input.status)
        if input.status == status_enum.live:
            dataset_updator.update_permissions(input.id, [], share_with_everyone=True)
        else:
            dataset_updator.update_permissions(input.id, [])

    # upload the dataset
    if input.dataset:
        dataset_updator.update_dataset_config(input.id, input.dataset)

    if input.tags:
        dataset_updator.update_tags(input.id, input.tags)

    notification = utils.Notification(message="Saved successfully", type=utils.NotificationTypeEnum.SUCCESS)

    if input.as_quick_save:
        # update the details so the user knows that we need to reprocess the materialization
        if len(input.materializations) > 0:
            notification = utils.Notification(
                message="Updated Dataset",
                description="Integrations will update on their next scheduled run. To run them now open “Integrations” and press save.",
                type=utils.NotificationTypeEnum.SUCCESS,
            )

        return dict(
            success=True,
            dataset_id=input.id,
            dataset_slug=input.slug,
            completed=completed,
            notification=notification,
        )

    # this script validates the dataset and triggers events
    mat_ids = []
    for mat in input.materializations:
        mat_obj = dataset_updator.api_mat_to_materialization(input.id, mat)

        # validate the materialization
        get_proccessor(mat_obj).validate(mat_obj)

        if mat_obj.id:
            mat_obj = dataset_updator.update_materialization(mat_obj)
        else:
            mat_obj = dataset_updator.create_materialization(input.id, mat_obj)

        # update the config
        # TODO: Once the UI updates, we can use the new data model for this
        dataset_updator._update_materialization(mat_obj.id, mat)

        mat_ids.append(mat_obj.id)

        # trigger the materialization
        dataset_updator.trigger_materialization(mat_obj, resync=True)

    cur_mats = graph_client.get_dataset_materializations(dataset_id=input.id).materializations

    for m in cur_mats:
        if m.id not in mat_ids:
            dataset_updator.delete_materialization(m.id)

    # resync the materialization inde
    dataset_updator.resync_id(input.id)

    # managed the trigger
    if len(input.materializations) > 0:
        completed.append("Triggered the Task Execution")

        # let the user know it was saved and triggered
        notification = utils.Notification(
            message="Integrations saved",
            description="Triggered a task to rerun all integrations for this dataset",
            type=utils.NotificationTypeEnum.SUCCESS,
        )

    return dict(
        success=True,
        dataset_id=input.id,
        dataset_slug=input.slug,
        completed=completed,
        notification=notification,
    )


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: UUIDStr, mavis: Mavis = Depends(get_mavis)):
    """Delete a dataset and all its materializations."""
    DatasetManager(mavis=mavis).delete(dataset_id)
    return dict(deleted_dataset=dataset_id)


@router.post("/duplicate", response_model=UpdateDatasetOutput)
async def duplicate_dataset(input: DatasetDuplicateInput, dataset_id: UUIDStr, mavis: Mavis = Depends(get_mavis)):
    dataset = DatasetManager(mavis=mavis).duplicate(dataset_id, input.name)
    return dict(
        success=True,
        dataset_id=dataset.id,
        dataset_slug=dataset.slug,
        completed=[],
        notification=None,
    )


@router.post(
    "/run",
    response_model=DatasetOutput,
    responses={200: {"content": {"application/json": {}, "text/CSV": {}}}},
)
async def run_dataset(
    input: RunDatasetInput,
    dataset_slug: str | None = None,
    group_slug: str | None = None,
    use_last_available: bool = False,
    run_live: bool = False,
    as_csv: bool = False,
    as_xls: bool = False,
    cancel: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    total_rows = None
    is_approx = False
    if dataset_slug:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(dataset_slug)
    else:
        dataset_id = None

    ds_obj = Dataset(
        mavis,
        id=dataset_id,
        obj=(dict(query=input.dataset.query, fields=input.dataset.input_fields) if input else None),
        limit=10_000 if as_csv or as_xls else 1_000,
    )

    if cancel:
        ds_obj.cancel(group_slug)
        return dict()
    else:
        data = ds_obj.run(group_slug, run_live=run_live)

    if as_csv or as_xls:
        fivetran_track(
            mavis.user,
            data=dict(
                action="downloaded_dataset",
                dataset_slug=dataset_slug,
                total_rows=total_rows,
            ),
        )
        if as_csv:
            return Response(content=data.to_csv(), media_type="text/CSV")
        else:
            return Response(content=data.to_xls(), media_type="application/vnd.ms-excel")

    else:
        metrics = []
        total_rows = data.total_rows
        is_approx = not data.context.is_all

        if group_slug:
            # get all number columns
            for c in ds_obj.model.tab(group_slug).output_columns:
                met = dict(
                    id=c.id,
                    label=c.label,
                    type=c.type,
                    kind="exact",
                )

                # Check the group
                if c.details.kind == DetailKindEnum.group:
                    metrics.append(
                        dict(
                            **met,
                            metrics_type="distribution",
                            metrics=[
                                dict(
                                    name=c,
                                    value="-",
                                    format="string",
                                )
                                for c in data.unique_column_values(data.column(c.id))[:20]
                            ],
                        )
                    )

                # don't bother with other types
                if not c.type != "number" or total_rows <= 1:
                    continue
        else:
            # loop through all the columns
            for c in data.columns:
                try:
                    (metrics_type, metric_dict) = create_column_metric(data, c)
                except Exception:
                    metrics_type = "distribution"
                    metric_dict = []

                # remove min for approx
                if is_approx and metrics_type == "min_max":
                    metric_dict = metric_dict[1:]

                # add the metric
                metrics.append(
                    dict(
                        id=c.id,
                        label=c.header_name,
                        type=c.type,
                        kind="approx" if is_approx else "exact",
                        metrics_type=metrics_type,
                        metrics=metric_dict,
                    )
                )

        if ds_obj.maintenance_started_at:
            notification = utils.Notification(
                message="Data used is under maintenance",
                description="An activity or dimension used is currently under maintenance",
                type=utils.NotificationTypeEnum.WARNING,
            )
        else:
            notification = None

        return dict(
            query=ds_obj.sql(group_slug),
            data=data.to_old(),
            column_mapping=[
                dict(id=c.id, label=c.field, format=format_to_old(c.context.format), pinned=c.context.pinned)
                for c in data.columns
            ],
            notification=notification,
            metrics=metrics,
            total_rows=total_rows,
            is_approx=is_approx,
        )


@router.post("/count", response_model=DatasetCountOutput)
async def run_dataset_count(
    input: DatasetMetricsInput,
    dataset_slug: str = None,
    group_slug: str = None,
    run_live: bool = False,
    cancel: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    ds_obj = Dataset(
        mavis,
        id=dataset_slug,
        obj=(dict(query=input.dataset.query, fields=input.dataset.input_fields) if input else None),
    )
    if cancel:
        ds_obj.cancel_count_rows(group_slug)
        total_rows = 0
    else:
        total_rows = ds_obj.count_rows(group_slug, run_live=run_live)
    return dict(total_rows=total_rows)


@router.post("/trigger_download", response_model=DownloadCSVDatasetOutput)
async def request_csv_download(
    input: RunDatasetInput,
    dataset_slug: str | None = None,
    group_slug: str | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    if group_slug:
        group_name = Dataset(mavis, obj=input.dataset.dict()).model.tab(group_slug).label
    else:
        group_name = "Parent"

    # upload the data to a temporary slug
    if not dataset_slug:
        updator = DatasetManager(mavis=mavis)
        d_graph = updator.create(name="Single Dataset", hide_from_index=True)
        updator.update_config(d_graph.id, input.dataset.dict())
        label = "Single Dataset"
    else:
        d_graph = graph_client.get_datasets_by_slug(slug=dataset_slug, company_id=mavis.company.id)
        label = d_graph.name

    materialization = Materialization(
        label=f"{label} - {group_name}",
        type=MaterializationTypeEnum.csv,
        dataset_id=d_graph.id,
        tab_slug=group_slug,
        details=CSVDetails(user_ids=[mavis.user.id], format="csv"),
    )
    materialize_dataset.send(company_slug=mavis.company.slug, materialization_attrs=materialization.dict())

    return dict(success=True)


@router.get("/groups", response_model=list[GroupAutocomplete])
@router.get("/groups_autocomplete", response_model=list[GroupAutocomplete])
async def list_groups(dataset_slug: str, mavis: Mavis = Depends(get_mavis)):
    """List all groups and their columns for a given dataset. Used for autocomplete."""
    dataset_id = DatasetManager(mavis=mavis)._slug_to_id(dataset_slug)
    dataset_query_obj = DatasetManager(mavis=mavis).get_config(dataset_id)

    if dataset_query_obj:
        result_groups = []
        group_keys = ["slug", "name"]
        column_keys = ["id", "label"]

        for group in dataset_query_obj["all_groups"]:
            columns = [dict((k, column[k]) for k in column_keys if k in column) for column in group["columns"]]
            result_group = dict((k, group[k]) for k in group_keys if k in group)
            result_group["columns"] = columns
            result_groups.append(result_group)

        parent_columns = [
            dict((k, column[k]) for k in column_keys if k in column) for column in dataset_query_obj["columns"]
        ]
        parent = dict(slug="parent", name="Parent", columns=parent_columns)
        result_groups.append(parent)

    return result_groups


@router.post("/pivot_values", response_model=PivotOutput)
async def get_pivot_values(
    input: RunDatasetInput = None,
    dataset_slug: str = None,
    group_slug: str = None,
    column_id: str = None,
    mavis: Mavis = Depends(get_mavis),
):
    if dataset_slug:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(dataset_slug)
    else:
        dataset_id = None

    ds_obj = Dataset(
        mavis,
        id=dataset_id,
        obj=(dict(query=input.dataset.query, fields=input.dataset.input_fields) if input else None),
    )
    data = ds_obj.run(group_slug)
    all_values = data.unique_column_values(data.column(column_id))
    # sort the values
    all_values.sort(key=lambda e: (e is None, e))
    # make them all strings
    all_values = [str(s) for s in all_values]

    return dict(values=all_values)
