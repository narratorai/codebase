import json

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.customer_facing.transformations.utils import TransformationManager
from core.graph import graph_client
from core.models.internal_link import PORTAL_URL
from core.models.service_limit import ServiceLimit, check_limit
from core.v4.blocks.shared_ui_elements import _input, _make_ui
from core.v4.blocks.transformation_context_v2 import (
    _push_query_to_production,
    _save_query,
)
from core.v4.mavis import Mavis

TITLE = "Batch Create"
DESCRIPTION = "This allows you to batch create transformations and datasets."
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(details=_input(title="Paste big object here")),
    )

    schema_ui = dict(details=_make_ui(widget="MarkdownWidget", options=dict(default_height=120)))

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    new_obj = json.loads(data["details"])
    content = []
    missing_activity_slugs = []

    # map the data of the activities
    # get all the activities from the new company
    new_comp_activities = graph_client.activity_index(company_id=mavis.company.id).all_activities
    new_comp_activity_mapping = {a.slug: a.id for a in new_comp_activities}

    trans_updator = TransformationManager(mavis=mavis)

    all_trans = {t.slug: t for t in graph_client.transformation_index(company_id=mavis.company.id).all_transformations}

    # loop through the object
    for kind in ("transformation", "dataset"):
        # creata  new sections
        content.append(f"# {utils.title(kind)}")

        # go through all the items
        for obj in new_obj:
            if obj["export_kind"] != kind:
                continue

            # savign the data
            if obj["export_kind"] == "transformation":
                slug = utils.slugify(data["current_script"]["name"])

                # check if it was recently created
                if all_trans.get(slug) and all_trans["slug"].created_at > utils.date_add(utils.utcnow(), "hour", -1):
                    continue

                _save_query(trans_updator, obj, None)

                if data["push_to_production"]:
                    _push_query_to_production(mavis, obj, obj["current_script"]["id"])

                content.append(
                    " - Synced {name}: {portal}/{company_slug}/transformations/edit/{transform_id}".format(
                        portal=PORTAL_URL,
                        company_slug=mavis.company.slug,
                        name=obj["current_script"]["name"],
                        transform_id=obj["current_script"]["id"],
                    )
                )

            elif obj["export_kind"] == "dataset":
                dataset_obj = obj["d_object"]

                can_sync = True
                activities = []
                for a in dataset_obj["query"]["activities"]:
                    # go throuthe slugs
                    for ii, s in enumerate(a["slug"]):
                        # replace the ids
                        if new_comp_activity_mapping.get(s):
                            a["activity_ids"][ii] = new_comp_activity_mapping[s]
                            activities.append(a["activity_ids"][ii])
                        else:
                            # let the user know that the activity was not found
                            if s not in missing_activity_slugs:
                                missing_activity_slugs.append(s)
                            can_sync = False
                            break

                if can_sync:
                    notification = check_limit(mavis.company.id, ServiceLimit.DATASETS)
                    # check for the limit
                    if notification:
                        content.append(" - Could not create {} because your passed your limits".format(obj["name"]))

                    else:
                        # savign the data
                        dataset_updator = DatasetManager(mavis=mavis)
                        dataset = dataset_updator.create(name=obj["name"], description=obj["description"])
                        dataset_updator.update_config(dataset.id, dataset_obj)
                        content.append("- CREATED {}".format(obj["name"]))
                else:
                    content.append("- FAILED to create {} because of missing activities".format(obj["name"]))

    if len(missing_activity_slugs) > 0:
        content.append(" # Missing Activities")
        content.extend(f" - Could not find {s}" for s in missing_activity_slugs)

    return [dict(type="markdown", value="\n".join(content))]
