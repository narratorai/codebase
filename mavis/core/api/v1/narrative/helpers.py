import hashlib

from core import utils
from core.api.customer_facing.reports.utils import NarrativeManager, NarrativeUpdator
from core.api.customer_facing.tasks.utils import TaskManager
from core.constants import AHMED_USER_ID, DATASET_KEYS, RESERVED_TAGS
from core.decorators.task import task
from core.errors import ForbiddenError
from core.graph import graph_client
from core.graph.sync_client.enums import company_task_category_enum
from core.models.ids import get_uuid, is_valid_uuid
from core.models.service_limit import ServiceLimit, check_limit
from core.util.tracking import fivetran_track
from core.v4.analysisGenerator import assemble_narrative, update_datasets_with_fields
from core.v4.mavis import Mavis, initialize_mavis

from .models import DynamicInput, NarrativeUpdateInput


@task()
def log_narrative_view(company_slug, narrative_slug, dynamic_fields):
    mavis = initialize_mavis(company_slug)
    nar = NarrativeManager(mavis=mavis)
    views = nar.get_views(narrative_slug)
    # add the data
    views["views"][str(dynamic_fields)] = dict(
        dynamic_fields=dynamic_fields,
        current_time=utils.utcnow(),
    )
    nar.update_views(narrative_slug, views)


def get_dynamic_narrative(
    mavis: Mavis,
    slug: str,
    snapshot,
    user_inputs,
    orginal_narrative_config=None,
    log_view=False,
):
    narrative_updator = NarrativeManager(mavis=mavis)
    # get the narrative!
    if orginal_narrative_config is None:
        narrative_id = narrative_updator._slug_to_id(slug)
        orginal_narrative_config = narrative_updator.get_config(narrative_id)

    # add the user's email to the inputs
    for df in orginal_narrative_config.get("dynamic_filters") or []:
        if df["type"] == "current_user_email":
            user_inputs.append(DynamicInput(name=df["name"], value=mavis.user.email))
            break

    # log the view for future caching
    if log_view:
        log_narrative_view.send(
            mavis.company.slug,
            slug,
            [d.dict() for d in user_inputs],
        )

    # get the run_timestamp with addition
    key = (
        f"{snapshot}/"
        + hashlib.md5(  # noqa: S303
            "".join([f"{u.name}.{str(u.value)}" for u in user_inputs]).encode(),
            usedforsecurity=False,  # noqa: S303
        ).hexdigest()  # noqa: S303
    )

    # get the analysis
    narrative_config = narrative_updator.get_snapshot(slug, key)

    # if no cache then process it
    if narrative_config is None:
        # get the narrative!
        narrative_config = orginal_narrative_config

        fivetran_track(
            mavis.user,
            data=dict(
                action="assembled_narrative",
                narrative_slug=slug,
                used_dyanmic=True,
            ),
        )
        field_overrides = {u.name: u.value or u.filter for u in user_inputs}

        # clean up dates
        for f in narrative_config["field_configs"]:
            if f.get("set_as_user_input") and field_overrides.get(f["name"]):
                if f["dynamic_type"] == "date":
                    field_overrides[f["name"]] = field_overrides[f["name"]][:10]

        # process the data
        return_obj = assemble_narrative(
            mavis,
            narrative_slug=slug,
            config=narrative_config,
            field_overrides=field_overrides,
            override_upload_key=key,
            cache_minutes=int(utils.date_diff(snapshot, utils.utcnow(), "minute")) + 10,
        )
        narrative_config = return_obj["narrative"]
    else:
        fivetran_track(
            mavis.user,
            data=dict(
                action="loaded_cached_narrative",
                narrative_slug=slug,
                used_dyanmic=True,
            ),
        )
        # add the other fields
    return narrative_config


def remove_field(field_configs, f, computed_fields):
    all_names = get_all_names(f)

    # remove the fields
    for name in all_names:
        computed_fields.pop(name, None)

    for tf in field_configs:
        # remove the field if it has a later dependency and is not already removed
        if any(n in tf["field_depends_on"] for n in all_names) and tf["name"] in computed_fields.keys():
            remove_field(field_configs, tf, computed_fields)


def get_all_names(f):
    return [f["name"], "#" + f["name"], "__" + f["name"]] + f.get("other_names", [])


def find_y_position(node_dict, y_pos, field_dependency_dict, id):
    if node_dict[id]["data"].get("y_position") is None:
        # find the first thing that depends on the field
        y_pos[node_dict[id]["data"]["x_position"]] += 1

        # lets set this as the next y
        current_y = y_pos[node_dict[id]["data"]["x_position"]]

        # set the position
        node_dict[id]["data"]["y_position"] = current_y

        # if there are any dependencies then zero it out
        if not any(id in v for _, v in field_dependency_dict.items()):
            for k, y in y_pos.items():
                y_pos[k] = max(current_y, y)


def update_narrative_config(mavis: Mavis, input, slug):
    nar = input.dict()

    # make sure every object as a UUIDStr
    for s in nar["narrative"]["sections"]:
        if not s.get("id"):
            s["id"] = get_uuid()

        for c in s["content"]:
            if not c.get("id"):
                c["id"] = get_uuid()

    # add a unique identifier to the keytakeways as well
    for k in nar["narrative"]["key_takeaways"]:
        if not k.get("id"):
            k["id"] = get_uuid()

    # remove any field in blocks
    fields_found = utils.recursive_find(nar, ["_raw_fields"], True, only_string=False)
    for f_slug, obj in fields_found:
        del obj[f_slug]

    # remove all the previous names
    for f in nar["field_configs"]:
        f["previous_names"] = []

    # update fields temporary
    fields = input.input_fields

    # find all dataset slugs
    update_datasets_with_fields(mavis, nar, fields=fields)
    nar_manager = NarrativeManager(mavis=mavis)
    nar_id = nar_manager._slug_to_id(slug)
    NarrativeUpdator(mavis=mavis).update_config(nar_id, nar)

    # update the data
    narrative_obj = graph_client.get_narrative_by_slug(company_id=mavis.company.id, slug=slug).narrative

    # check permissions before updating a narrative
    if (
        narrative_obj
        and len(narrative_obj) > 0
        and not mavis.user.is_admin
        and narrative_obj[0].created_by != mavis.user.id
    ):
        raise ForbiddenError("User cannot update this Narrative that they did not create. Please contact your admin")

    # get the
    dataset_slugs = list(set(utils.recursive_find(nar, DATASET_KEYS, False)))

    # if the narrative is saved
    if len(narrative_obj) > 0:
        if dataset_slugs:
            datasets = graph_client.get_datasets_by_slug(company_id=mavis.company.id, slugs=dataset_slugs).dataset

            # update all the dataset relationships
            graph_client.update_narrative_relations(
                narrative_id=narrative_obj[0].id,
                narrative_datasets=[dict(dataset_id=d.id, narrative_id=narrative_obj[0].id) for d in datasets],
            )

        # update the config
        graph_client.update_narrative_config(narrative_id=narrative_obj[0].id, updated_by=mavis.user.id)

    return dict(success=True)


def update_narrative(mavis: Mavis, narrative_input: NarrativeUpdateInput):
    completed = []
    notification = None
    original_narrative = None

    if narrative_input.narrative_id:
        # get the dataset from graph and check if the user is the same user
        original_narrative = graph_client.get_full_narrative(id=narrative_input.narrative_id).narrative_by_pk

        if (
            not mavis.user.is_internal_admin
            and mavis.user.id is not None
            and mavis.user.id != original_narrative.created_by
        ):
            raise ForbiddenError(
                "User cannot update this Narrative that they did not create. Please contact your admin"
            )

    if narrative_input.category:
        all_categories = {
            c.category: c.id for c in graph_client.get_all_categories(company_id=mavis.company.id).company_categories
        }

        # check if the category exists
        if all_categories.get(narrative_input.category):
            category_id = all_categories[narrative_input.category]
        else:
            category_id = graph_client.insert_category(
                company_id=mavis.company.id,
                category=utils.slugify(narrative_input.category),
                color=utils.new_color(),
            ).inserted_category.id
            completed.append("Inserted the category")
    else:
        category_id = None

    task_slug = f"n_{narrative_input.slug}"
    task_id = None
    # update the task
    if narrative_input.schedule:
        if not narrative_input.narrative_id:
            notification = check_limit(mavis.company.id, ServiceLimit.NARRATIVES)

        # if the Narrative exists then update the schedule
        if (
            original_narrative
            and original_narrative.company_task
            and narrative_input.schedule != original_narrative.company_task.schedule
        ):
            TaskManager(mavis=mavis).update_properties(
                original_narrative.company_task.id, schedule=narrative_input.schedule
            )
            task_id = original_narrative.company_task.id
            completed.append("Updated schedule")

        else:
            from batch_jobs.data_management.run_narrative import run_narrative

            task_updator = TaskManager(mavis=mavis)
            task_id = task_updator.create(
                run_narrative,
                narrative_input.schedule,
                task_slug,
                category=company_task_category_enum.narratives.value,
                task_fields=dict(slug=narrative_input.slug),
            ).id
            completed.append("Created new schedule")

    elif original_narrative and original_narrative.company_task and original_narrative.company_task.id:
        TaskManager(mavis=mavis).delete(id=original_narrative.company_task.id)
        completed.append("Deleted the task")
        task_id = None

    # reset the type
    if original_narrative and narrative_input.type is None:
        narrative_input.type = original_narrative.type.value

    # auto layout the narrative
    if (
        original_narrative
        and narrative_input
        and original_narrative.type
        and original_narrative.type.value != narrative_input.type
        and narrative_input.type == "dashboard"
    ):
        _auto_layout_narrative(mavis, narrative_input.slug)

    # insert the narrative
    narrative = graph_client.insert_narrative(
        company_id=mavis.company.id,
        created_by=narrative_input.created_by or mavis.user.id or AHMED_USER_ID,
        updated_by=mavis.user.id or AHMED_USER_ID,
        requested_by=narrative_input.requested_by,
        name=narrative_input.name,
        slug=narrative_input.slug,
        description=narrative_input.description,
        category_id=category_id,
        state=narrative_input.state,
        type=narrative_input.type or "analysis",
        task_id=task_id,
    ).insert_narrative_one

    # add all the tags
    for t in narrative_input.tags or []:
        if not is_valid_uuid(t):
            try:
                t = graph_client.insert_tag(
                    company_id=mavis.company.id,
                    tag=utils.slugify(t),
                    color=utils.new_color(),
                ).inserted_tag.id

            except Exception as e:
                # get the id
                if "company_tags_tag_company_id_key_unique" in utils.get_error_message(e):
                    t = (
                        graph_client.get_company_tag(
                            company_id=mavis.company.id,
                            tag=utils.slugify(t),
                        )
                        .company_tags[0]
                        .id
                    )
                else:
                    raise (e)

        graph_client.insert_tag_item_one(related_to="narrative", related_id=narrative.id, tag_id=t)

    # remove the other tags
    if original_narrative:
        for t in original_narrative.tags:
            if t.tag_id not in (narrative_input.tags or []) and t.company_tag.tag not in RESERVED_TAGS:
                graph_client.delete_tagged_item(id=t.id)

    # get all the datasets associated to this narrative
    if original_narrative and original_narrative.template_id:
        for d in narrative.narrative_datasets:
            graph_client.update_datasetstatus(id=d.dataset_id, status=narrative_input.state)

    if narrative_input.depends_on:
        graph_client.update_narrative_depends(
            narrative_id=narrative.id,
            update_narratives=[
                dict(
                    narrative_id=narrative.id,
                    depends_on_narrative_id=n_id,
                )
                for n_id in narrative_input.depends_on
            ],
        )

    return dict(
        success=True,
        narrative_slug=narrative_input.slug,
        narrative_id=narrative.id,
        completed=completed,
        notification=notification,
        task_id=task_id,
    )


def _auto_layout_narrative(mavis: Mavis, slug: str):
    narrative_manager = NarrativeManager(mavis=mavis)
    narrative_id = narrative_manager._slug_to_id(slug)
    nar = narrative_manager.get_config(narrative_id)

    for s in nar["narrative"]["sections"]:
        # Add the id and version if non-exists
        if s.get("id") is None:
            s["id"] = get_uuid()
            s["_dashboard_layout_version"] = 1

        x = 0
        y = 0
        nx = 0
        ny = 0
        last_type = None

        # go through the content and update it
        for c in s["content"]:
            # if the id exists and the layout exists, skip
            if c.get("id") and c.get("grid_layout"):
                continue

            c["id"] = get_uuid()

            if c["type"] == "metric_v2":
                w = 9
                h = 10
                mw = 5
                mh = 6

                # show values
                if c["data"].get("add_comparison"):
                    h += 2
                if c["data"].get("show_values_in_plot"):
                    h += 4

            elif c["type"] == "plot_v2":
                w = 24
                h = 20
                mw = 10
                mh = 12

            elif c["type"] == "markdown":
                w = 48
                h = max(1 + round(len(c["text"].split("\n")) / 3), 6)
                mw = 5
                mh = 4

            # create the layout
            c["grid_layout"] = dict(
                w=w,
                h=h,
                x=x,
                y=y,
                i=get_uuid(),
                moved=False,
                static=False,
                minW=mw,
                minH=mh,
            )

            # add the next section
            nx = x + w
            ny = y

            # new row
            if nx >= 48 or (last_type is not None and c["type"] != last_type):
                nx = 0
                ny = y + h

            # keep saving the types
            last_type = c["type"]

            y = ny
            x = nx

    NarrativeManager(mavis=mavis).update_config(slug, nar)
