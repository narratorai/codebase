# TODO create core.models.dataset (v4?) for the output models
from collections import defaultdict
from graphlib import TopologicalSorter

from fastapi import APIRouter, Depends

from core import utils
from core.api.auth import get_mavis
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.reports.utils import NarrativeManager
from core.constants import AHMED_USER_ID, DATASET_KEYS
from core.graph import graph_client, make_sync_client
from core.logger import get_logger
from core.models.ids import UUIDStr, get_uuid
from core.models.service_limit import ServiceLimit, check_limit
from core.util.tracking import fivetran_track
from core.v4 import createDataset, narrativeTemplate
from core.v4.analysisGenerator import (
    _create_fields,
    _get_cache,
    _get_default_fields,
    assemble_narrative,
    fields_to_autocomplete,
    get_dependencies,
    process_block,
    replace_field_variable,
    spell,
)
from core.v4.block import Block
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import fill_in_template, get_required_fields

from .helpers import (
    find_y_position,
    get_all_names,
    get_dynamic_narrative,
    remove_field,
    update_narrative,
    update_narrative_config,
)
from .models import (
    BlockInput,
    BlockResult,
    ComponentInput,
    DynamicNarrativeInput,
    FieldInput,
    FieldsResults,
    FilterOptionsOutput,
    GraphOutput,
    NarrativeConfigBlockInput,
    NarrativeConfigInput,
    NarrativeConfigOutput,
    NarrativeDuplicateInput,
    NarrativeIconInput,
    NarrativeLoadInput,
    NarrativeLoadOutput,
    NarrativeResult,
    NarrativeUpdateBasicOutput,
    NarrativeUpdateInput,
    NarrativeUpdateOutput,
)

logger = get_logger()

router = APIRouter(prefix="/narrative", tags=["narrative"])


@router.post("/load_block", response_model=BlockResult)
async def get_narrative_block(input: BlockInput, mavis: Mavis = Depends(get_mavis)):
    """Get a block and prepares the input."""
    data = input.data or {}

    # updated the mapping to the proper mapping
    if input.block_slug == "value":
        input.block_slug = "value_field"

    # remove the current field from the list of fields
    data["_raw_fields"] = input.input_fields

    # keep track of previous names
    if not data.get("previous_names"):
        data["previous_names"] = []

    # keep track of all the names
    if data.get("name"):
        # deal with the previous name
        if data.get("name").endswith("_copy"):
            data["previous_names"] = []
        elif data.get("name") not in data["previous_names"]:
            data["previous_names"].append(data["name"])

        data["_raw_fields"].pop(utils.slugify(data["name"]), None)
        data["_raw_fields"].pop("#" + utils.slugify(data["name"]), None)

    if not isinstance(data, list):
        data["requester"] = dict(email=mavis.user.email)

    block = Block(mavis, input.block_slug, data)

    # if field configs then replace the object with the proper data
    block.process_data()
    return block.update_schema()


@router.post("/load_config_block", response_model=BlockResult)
async def get_narrative_config_block(
    input: NarrativeConfigBlockInput,
    mavis: Mavis = Depends(get_mavis),
):
    """Get a block and prepares itn einput."""
    data = dict(narrative=input.narrative, type=input.type)
    block_slug = "narrative_config"
    block = Block(mavis, block_slug, data)

    # if field configs then replace the object with the proper data
    return block.update_schema()


@router.post("/autcomplete")
async def get_autocomplete(input: FieldsResults, mavis: Mavis = Depends(get_mavis)):
    """Returns the autocomplete."""
    return fields_to_autocomplete(mavis, input.input_fields, include_pretty=True)


@router.post("/fields/dependency_graph", response_model=GraphOutput)
async def get_field_dependency(input: FieldInput, mavis: Mavis = Depends(get_mavis)):
    dependencies = get_dependencies(mavis, input.field_configs)
    field_dependency_dict, group_name_mapping = dependencies

    ordered_dependencies = list(TopologicalSorter(field_dependency_dict).static_order())
    nodes = []

    # create a mapping of the fields to have them be in orders
    field_objs = {f["name"]: f for f in input.field_configs}

    # create the position based on the dependencies
    x_pos = dict()

    for o in ordered_dependencies:
        # show dependence
        if len(field_dependency_dict[o]) == 0:
            x_pos[o] = 0
        else:
            x_pos[o] = max(x_pos.get(tf, 0) for tf in field_dependency_dict[o]) + 1

        if o.startswith("g"):
            g = group_name_mapping[o]
            data = dict(
                label=g["label"],
                node_kind="dataset",
                dataset_slug=g["slug"],
                group_slug=g["group_slug"],
                x_position=x_pos[o],
                depends_on=field_dependency_dict[o],
            )
        else:
            f = field_objs[o]
            val = input.input_fields.get(f["name"])

            data = dict(
                label=utils.title(f["name"]),
                node_kind="field",
                kind=f["kind"],
                failed=val is None or str(val).startswith("FAILED") or "mavis-error" in str(val),
                unused=f.get("unused", False),
                value=input.input_fields.get("#" + f["name"]),
                x_position=x_pos[o],
                depends_on=field_dependency_dict[o],
            )

        # add the node
        nodes.append(dict(id=o, data=data))

    # make it a dict to make it easier to use
    node_dict = {n["id"]: n for n in nodes}
    y_pos = {v: 0 for k, v in x_pos.items()}

    # Compute the Y position
    for n in nodes:
        find_y_position(node_dict, y_pos, field_dependency_dict, n["id"])

    branches = []

    # go through all the dependencies
    for k, deps in field_dependency_dict.items():
        branches.extend(dict(id=f"e.{d}.{k}", source=d, target=k) for d in deps)
    return dict(nodes=nodes, branches=branches)


@router.post("/fields/compile", response_model=FieldsResults)
async def compile_fields(input: FieldInput, mavis: Mavis = Depends(get_mavis)):
    # setup the fields
    current_fields = input.input_fields or {}

    # TODO: FIGURE OUT LATER how to delete
    # default_configs = _get_default_fields(mavis)
    # current_fields = []
    # for f in (input.field_configs + default_configs)
    #     current_fields

    changed_fields = {f["name"] for f in input.field_configs_changed or []}
    field_configs = [f for f in input.field_configs if f["name"] not in changed_fields]

    # get all the removed fields and their dependencies
    for f in input.field_configs_changed or []:
        # if it is not in the field config then add it
        if f["name"] in current_fields.keys():
            remove_field(input.field_configs, f, current_fields)

        # add all the new values
        field_configs.append(f)

    # compute the necessary fields
    fields, updated, _ = _create_fields(
        mavis,
        field_configs,
        cache_minutes=10000000,
        fields=current_fields,
    )

    return dict(fields=fields, updated=updated)


@router.delete("/fields/compile", response_model=FieldsResults)
async def delete_compiled_fields(input: FieldInput, mavis: Mavis = Depends(get_mavis)):
    updated = []
    # remove the fields
    for f in input.field_configs_changed:
        for n in get_all_names(f):
            updated.append(n)
            if input.input_fields:
                input.input_fields.pop(n, None)
        input.input_fields.pop("#" + f["name"], None)
        input.input_fields.pop("__" + f["name"], None)

    return dict(fields=input.input_fields, updated=updated)


@router.post("/content/compile")
async def compile_content(input: ComponentInput, mavis: Mavis = Depends(get_mavis)):
    """
    Compile Content can process string, lists, dict.

    - It will fill in the values with fields (will put the output value in `marking`)
    - If it is a block, it will process the block and return the output.
    """
    # handle null fields
    if input.input_fields is None:
        input.input_fields = {}

    local_cache = _get_cache(None, None)
    local_cache["_fields"] = input.input_fields

    compiled_content = []

    if input.contents:
        for content in input.contents:
            block_content = _compile_content(mavis, content, input.input_fields, local_cache)
            utils.extend_list(compiled_content, block_content)
    elif isinstance(input.content, dict):
        compiled_content = _compile_content(mavis, input.content, input.input_fields)
    else:
        compiled_content = fill_in_template(input.content, input.input_fields, mavis=mavis)

    return dict(compiled_content=compiled_content)


@router.get("/run/{slug}", response_model=NarrativeResult)
async def run_narrative(slug: str, mavis: Mavis = Depends(get_mavis)):
    narrative_updator = NarrativeManager(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(slug)
    narrative_config = narrative_updator.get_config(narrative_id)
    fivetran_track(mavis.user, data=dict(action="assembled_narrative", narrative_slug=slug))

    return assemble_narrative(mavis, narrative_slug=slug, config=narrative_config)


@router.post("/update_image")
async def update_narrative_img(input: NarrativeIconInput, mavis: Mavis = Depends(get_mavis)):
    NarrativeManager(mavis=mavis).update_img(input.narrative_id, input.image)
    graph_client.update_narrative_snapshot(id=input.narrative_id)
    return {}


@router.get("/index_with_image", response_model=list[dict])
async def index_with_image(mavis: Mavis = Depends(get_mavis)):
    user_graph = make_sync_client(mavis.user.token)
    narrative_index = user_graph.dashboard_index(company_id=mavis.company.id).narrative

    imgs = NarrativeManager(mavis=mavis).get_images()["images"]
    # create a list of the index with the images
    return [dict(**ni.dict(), image=imgs.get(ni.id, None)) for ni in narrative_index]


@router.post("/load_filter_config", response_model=dict)
async def load_filter_config(input: NarrativeConfigInput, mavis: Mavis = Depends(get_mavis)):
    data = dict(
        narrative={k: v for k, v in input.dict().items() if k not in ("type", "input_fields")},
        type=input.type,
        _raw_fields=input.input_fields,
    )

    block = Block(mavis, "narrative_config", data)
    res = block.update_schema()

    return dict(**res, block_slug="narrative_config")


@router.get("/get_config", response_model=dict)
async def load_narrative_config(slug: str, mavis: Mavis = Depends(get_mavis)):
    narrative_updator = NarrativeManager(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(slug)
    res = narrative_updator.get_config(narrative_id)
    return res


@router.post("/load", response_model=NarrativeLoadOutput)
async def load_narrative(input: NarrativeLoadInput, mavis: Mavis = Depends(get_mavis)):
    narrative_output = {}
    snapshot_ts = input.snapshot

    # if no inputs then load the narrative
    if input.dynamic_fields:
        narrative = get_dynamic_narrative(mavis, input.slug, snapshot_ts, input.dynamic_fields, log_view=True)
    else:
        narrative_manager = NarrativeManager(mavis=mavis)
        narrative_id = narrative_manager._slug_to_id(input.slug)
        orginal_narrative_config = narrative_manager.get_config(narrative_id)
        # Check if the Narrative has dynamic filters (ex. current user)
        if input.dynamic_fields or any(
            df["type"] == "current_user_email" for df in orginal_narrative_config.get("dynamic_filters") or []
        ):
            narrative = get_dynamic_narrative(
                mavis,
                input.slug,
                snapshot_ts,
                input.dynamic_fields,
                orginal_narrative_config=orginal_narrative_config,
                log_view=True,
            )
        else:
            narrative = narrative_manager.get_snapshot(input.slug, snapshot_ts)

    # return the narrative
    if narrative:
        narrative_output.update(**narrative)

    # process the narrative
    return narrative_output


@router.post("/get_dynamic_narrative", response_model=NarrativeResult)
async def post_get_dynamic_narrative(input: DynamicNarrativeInput, mavis: Mavis = Depends(get_mavis)):
    return get_dynamic_narrative(
        mavis,
        input.slug,
        input.run_timestamp,
        input.user_inputs,
    )


@router.get("/get_filter_options", response_model=FilterOptionsOutput)
async def get_filter_options(slug: str, mavis: Mavis = Depends(get_mavis)):
    return _get_filter_options(mavis, slug)


@router.post("/apply_filter_options", response_model=NarrativeUpdateBasicOutput)
async def apply_filter_options(input: FilterOptionsOutput, slug: str, mavis: Mavis = Depends(get_mavis)):
    return _apply_filters_options(mavis, slug, input)


def _apply_filters_options(mavis, narrative_slug, apply_config: FilterOptionsOutput):
    # Check for permission

    user_graph = make_sync_client(mavis.user.token)

    nar_obj = user_graph.get_narrative_by_slug(company_id=mavis.company.id, slug=narrative_slug).narrative[0]

    plan = []
    current_options = _get_filter_options(mavis, narrative_slug, nar_obj=nar_obj)

    # process all the updates
    for d in nar_obj.narrative_datasets:
        ds = DatasetManager(mavis=mavis).get_config(d.dataset.id)
        d_obj = ds.obj

        temp_cols = {c["id"]: c for c in d_obj.ds.get_all_columns(ds.obj["query"])}

        # Add all the activity ones
        if apply_config.cohort_activity_options.visible:
            # remove all the filters
            for f in current_options.cohort_activity_options.selected_filters:
                if f.column_id:
                    createDataset._add_action(plan, "remove_filters", column=temp_cols[f.column_id])

            for f in apply_config.cohort_activity_options.selected_filters:
                createDataset.apply_quick_explore(Dataset(mavis, obj=d_obj), plan, column=f, filter=f.filter)

        # add all the customer ones
        if apply_config.customer_options.visible:
            # remove all the filters
            for f in current_options.customer_options.selected_filters:
                if f.column_id:
                    createDataset._add_action(plan, "remove_filters", column=temp_cols[f.column_id])

            for f in apply_config.customer_options.selected_filters:
                createDataset.apply_quick_explore(Dataset(mavis, obj=d_obj), plan, column=f, filter=f.filter)

        # add the time one
        if apply_config.time_option.visible:
            cohort_ts_column = createDataset._get_cohort_column(d_obj["query"], "ts")

            ts_col = createDataset.PossibleColumn(
                column_id=cohort_ts_column["id"],
                activity_id=createDataset._get_activity_id(cohort_ts_column),
            )
            createDataset.apply_quick_explore(
                Dataset(mavis, obj=d_obj),
                plan,
                column=ts_col,
                filter=apply_config.time_option.selected_filter,
                remove_filters=True,
            )

        # add the swap resolution
        if apply_config.time_resolution_option.visible:
            createDataset._add_action(
                plan,
                "swap_time_resolution",
                time_resolution=apply_config.time_resolution_option.resolution,
            )

        res = createDataset._update_plan(Dataset(mavis, obj=d_obj), plan)
        DatasetManager(mavis=mavis).update_dataset_config(d.dataset.id, res["staged_dataset"])

    return dict(success=True, rerun=True)


def _is_customer(c):
    return c.opt_group == "Customer Attributes"


def _get_filter_options(mavis: Mavis, narrative_slug, nar_obj=None):
    if not nar_obj:
        user_graph = make_sync_client(mavis.user.token)
        # Check for permission
        nar_obj = user_graph.get_narrative_by_slug(company_id=mavis.company.id, slug=narrative_slug).narrative[0]

    # predefine the filter
    filter_options = FilterOptionsOutput()
    last_activity_key = None
    last_stream = None
    set_tf = False

    for d in nar_obj.narrative_datasets:
        d_obj = DatasetManager(mavis=mavis).get_config(d.dataset.id)
        cohort = createDataset._get_cohort_activity(d_obj["query"])
        stream = cohort["config"]["activity_stream"]
        activity_key = str(cohort["activity_ids"])
        filter_options.cohort_activity = cohort

        # If changing Ids
        if last_activity_key and last_activity_key != activity_key:
            filter_options.cohort_activity_options.visible = False

        if cohort["config"]["has_source"]:
            filter_options.customer_options.visible = False

        # if different streams then turn everything off
        if last_stream and last_stream != stream:
            filter_options.cohort_activity_options.visible = False
            filter_options.customer_options.visible = False
            filter_options.time_option.visible = False

        if utils.is_time(cohort["activity_ids"][0]):
            filter_options.cohort_activity_options.visible = False
            filter_options.customer_options.visible = False
            filter_options.time_resolution_option.resolution = cohort["activity_ids"][0]

        else:
            column_options, selected_filters, time_filters = createDataset.get_quick_explore_columns(
                Dataset(mavis, obj=d_obj), just_cohort=True
            )

            if filter_options.customer_options.visible or filter_options.cohort_activity_options.visible:
                # add the customer options
                filter_options.customer_options.column_options = [c for c in column_options if _is_customer(c)]
                filter_options.customer_options.selected_filters = [c for c in selected_filters if _is_customer(c)]

                # add the filter options for the cohort
                filter_options.cohort_activity_options.column_options = [
                    c for c in column_options if not _is_customer(c)
                ]
                filter_options.cohort_activity_options.selected_filters = [
                    c for c in selected_filters if not _is_customer(c)
                ]

            # handling time filters
            if time_filters:
                if len(time_filters) > 1 or (set_tf and time_filters[0] != filter_options.time_option.selected_filter):
                    filter_options.time_option.visible = False
                else:
                    nf = time_filters[0]

                    if nf["operator"].startswith("greater_than"):
                        nf = dict(
                            operator="time_range",
                            from_type="absolute",
                            value_resolution=nf["value_resolution"],
                            from_value_resolution=nf["value_resolution"],
                            from_value=nf["value"],
                            to_type="now",
                        )
                    elif nf["operator"].startswith("less_than"):
                        nf = dict(
                            operator="time_range",
                            from_type="start_of_time",
                            to_type="absolute",
                            to_value_resolution=nf["value_resolution"],
                            to_value=nf["value"],
                        )
                    elif nf["operator"] != "time_range":
                        filter_options.time_option.visible = False

                    # add the time filter
                    filter_options.time_option.selected_filter = nf
                    set_tf = True

            # if some have filters and others don't, hide the time filter
            elif set_tf:
                filter_options.time_option.visible = False

            # Find the date_trunc column
            time_res = createDataset.find_time_res_column(Dataset(mavis, obj=d_obj))

            if time_res:
                # check if there are multiple time resolutions
                if (
                    filter_options.time_resolution_option.resolution
                    and filter_options.time_resolution_option.resolution != time_res
                ):
                    filter_options.time_option.visible = False
                else:
                    filter_options.time_resolution_option.resolution = time_res

            # save the activity key
            last_activity_key = activity_key

    filter_options.details = "\n".join(
        [
            "### Why do I see the filters that I see",
            " - Time Resolution filter: Will only show if all the groups used in this dataset are a consistent resolution",
            " - Time Filter: Will only show if all the filters on time in all your Datasets are the same/No filters",
            " - Cohort Activity Filter: Will only show if all the datasets use the same cohort activity",
            " - Customer Filter:  If all the dataset's cohort activity are not using Identity Resolution or is a Time Cohort",
            "\n<br>\n",
            "We have these limitations to ensure the filter makes sense and your filters don't change something that you wouldn't expect",
        ]
    )
    return filter_options


@router.post("/refresh_data", response_model=NarrativeConfigOutput)
async def refresh_narrative_data(input: NarrativeConfigInput, mavis: Mavis = Depends(get_mavis)):
    """Update a narrative config in s3 and tries to fix any dependency issues."""
    nar = input.dict()

    if not input.input_fields:
        input.input_fields = {}

    dataset_updator = DatasetManager(mavis=mavis)
    # update the dataset mapping id code
    # create the references
    dataset_references = defaultdict(list)

    # get all the required and figure it out if is need
    required_fields = get_required_fields(nar)

    # compute the unused fields
    for f in nar["field_configs"]:
        f["unused"] = f["name"] not in required_fields
        f["field_depends_on"] = [
            r for r in list(set(get_required_fields(f))) if r in input.input_fields.keys() and r != f["name"]
        ]

    # get all the datasets
    dataset_narrative_objs = utils.recursive_find(nar, DATASET_KEYS, True)

    # convert the objects into a dictionary
    for k, d in dataset_narrative_objs:
        dataset_references[d[k]].append(d)

    used_datasets = {}
    # for each slug replace all the swap_ids
    for dataset_slug, all_references in dataset_references.items():
        dataset_id = dataset_updator._slug_to_id(dataset_slug)
        used_datasets[dataset_slug] = used_datasets.get(dataset_slug, dataset_updator.get_config(dataset_id))

        d_obj = used_datasets[dataset_slug]["query"]
        # look through each reference
        for obj in all_references:
            group_slug = next(
                (obj.get(k) or None for k in ["group_slug", "left_group_slug"] if k in obj.keys()),
                None,
            )

            # get all the swaps
            for swap in d_obj.get("swapped_ids") or []:
                if swap.get("group_slug") == group_slug:
                    utils.recursive_update(
                        obj,
                        replace_field_variable,
                        old_field=swap["old_id"],
                        new_field=swap["new_id"],
                    )
                    refresh = True

    # compile the fields
    new_fields, updated, ordered_configs = _create_fields(
        mavis,
        nar["field_configs"],
        narrative=nar["narrative"],
        cache_minutes=10000000,
    )

    # reorder the configs
    nar["field_configs"] = ordered_configs

    # diff the fields to find if anything changed to see if it is worth refreshing
    updated = [f for f, v in new_fields.items() if input.input_fields.get(f) != v and f not in ("now", "random_number")]
    refresh = any(updated)

    nar["fields"] = new_fields

    # remove any field in blocks
    fields_found = utils.recursive_find(nar, ["_raw_fields", "requester"], True, only_string=False)
    for f_slug, obj in fields_found:
        del obj[f_slug]

    updated_names = False
    # Fix the old names that were used in field configs (this is needed when a user updates the name of a field)
    # for each config, find if any previous name is not in all the names
    current_names = [f["name"] for f in input.field_configs]
    for f in nar["field_configs"]:
        for old_name in f.get("previous_names") or []:
            if old_name not in current_names:
                # replace all the config fields
                utils.recursive_update(
                    nar,
                    replace_field_variable,
                    old_field=old_name,
                    new_field=f["name"],
                )

                for _k, d_obj in used_datasets.items():
                    utils.recursive_update(
                        d_obj,
                        replace_field_variable,
                        old_field=old_name,
                        new_field=f["name"],
                    )
                updated_names = True

                refresh = True
        # reset it so you don't keep trying to update the names int he future
        f["previous_names"] = []

    if updated_names:
        for k, d_obj in used_datasets.items():
            dataset_id = dataset_updator._slug_to_id(k)
            dataset_updator.update_dataset_config(dataset_id, d_obj)

    # get all the required and figure it out if is need
    required_fields = get_required_fields(nar)

    # compute the unused fields
    for f in nar["field_configs"]:
        f["unused"] = f["name"] not in required_fields
        f["field_depends_on"] = [
            r for r in list(set(get_required_fields(f))) if r in new_fields.keys() and r not in get_all_names(f)
        ]

    # remove the default fields
    default_fields = [df["name"] for df in _get_default_fields(mavis)]
    nar["field_configs"] = [f for f in nar["field_configs"] if f["name"] not in default_fields]

    # add an always refresh to fix the order and depends on and all that
    refresh = True
    return dict(**nar, refresh=refresh, updated=updated)


@router.put("/update_config/{slug}")
async def update_config(
    input: NarrativeConfigInput,
    slug: str,
    mavis: Mavis = Depends(get_mavis),
):
    """Update a narrative config in s3 and tries to fix any dependency issues."""
    return update_narrative_config(mavis, input, slug)


@router.post("/update", response_model=NarrativeUpdateOutput)
async def update(input: NarrativeUpdateInput, mavis: Mavis = Depends(get_mavis)):
    res = update_narrative(mavis, input)

    # if there is a config then update it
    if input.config:
        logger.debug("Updating narrative config", slug=input.slug)
        update_narrative_config(mavis, input.config, input.slug)

    return res


@router.post("/duplicate", response_model=NarrativeUpdateOutput)
async def duplicate_narrative(
    input: NarrativeDuplicateInput,
    narrative_id: UUIDStr,
    mavis: Mavis = Depends(get_mavis),
):
    completed = []
    notification = check_limit(mavis.company.id, ServiceLimit.NARRATIVES)

    # get the narrative
    nar = graph_client.get_narrative(id=narrative_id).narrative_by_pk

    new_slug = utils.slugify(input.name) + get_uuid()[:8]

    fivetran_track(mavis.user, data=dict(action="duplicate_narrative", narrative_slug=nar.slug))
    # duplicate the files
    narrative_updator = NarrativeManager(mavis=mavis)
    narrative_id = narrative_updator._slug_to_id(nar.slug)
    temp_nar = narrative_updator.get_config(narrative_id)

    if input.duplicate_datasets:
        # create the activities
        activities = {
            a.id: a for a in graph_client.activity_index_w_columns(company_id=mavis.company.id).all_activities
        }

        # create the template
        filled_template = narrativeTemplate.create_template(
            mavis,
            temp_nar,
            # this is the word mapping
            [],
            [],
            activities,
            {},
            {},
            replace_variables=False,
        )
        # update the name of the template
        filled_template.name = input.name
        filled_template.id = nar.template_id

        narrativeTemplate.create_narrative(
            mavis,
            filled_template,
            add_to_graph=True,
            narrative_slug=new_slug,
            narrative_type=nar.type.value if nar.type else "analysis",
            hide_dataset=False,
            locked=False,
        )
    else:
        # duplicate the narrative
        narrative_id = graph_client.insert_narrative(
            company_id=mavis.company.id,
            created_by=mavis.user.id or AHMED_USER_ID,
            updated_by=mavis.user.id or AHMED_USER_ID,
            name=input.name,
            slug=new_slug,
            state="in_progress",
            description=nar.description,
            type=nar.type.value,
        ).insert_narrative_one.id
        narrative_updator.update_config(narrative_id, temp_nar)

    return dict(
        success=True,
        narrative_slug=new_slug,
        narrative_id=narrative_id,
        completed=completed,
        notification=notification,
    )


def markdown_value(key, value):
    if isinstance(value, str) and "#" in key and "\n" not in value:
        return f"`{value}`"
    else:
        return value


def _compile_content(mavis: Mavis, content, fields, local_cache=None):
    if content and content.get("type") == "markdown":
        # add the `` around any variable that is single line (this should handle tables)
        fields = {k: markdown_value(k, v) for k, v in fields.items()}

    # compiles the fields
    content = fill_in_template(content, fields, ignore_conditions=True, mavis=mavis)
    content = process_block(mavis, content, local_cache)

    # deal with misspelled words
    if content and isinstance(content, dict) and content.get("type") == "markdown" and content.get("text"):
        mispelled_words = spell.unknown(
            [
                w.rstrip(".|,|*|_|!|?|)").lstrip("*|_|(")  # noqa: B005
                for w in str(content["text"]).split()
            ]  # noqa: B005
        )

        for ms in mispelled_words:
            # remove all the words that are not in fields or values
            if (
                ms not in fields.keys()  # check if it is a field
                and ms not in fields.values()  # check if it is a value
                and ms.isalpha()
                and len(ms) > 1
            ):
                content["text"] = content["text"].replace(ms, f'<span class="text-error spelling">{ms}</span>')

    return content
