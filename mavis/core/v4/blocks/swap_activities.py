from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.graph import graph_client, make_sync_client
from core.logger import get_logger
from core.models.internal_link import InternalLink
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_ui,
    _space,
)
from core.v4.mavis import Mavis

logger = get_logger()

TITLE = "Swap Activities"
DESCRIPTION = "Allows you to swap all dependencies on one activity to another activity."
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    all_activiites = [
        dict(id=a.id, name=f"{a.name} ({a.company_table.activity_stream})")
        for a in make_sync_client(mavis.user.token).activity_index(company_id=mavis.company.id).all_activities
    ]

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            from_activity=_drop_down(
                all_activiites,
                "id",
                "name",
                title="From Activity",
            ),
            to_activity=_drop_down(all_activiites, "id", "name", title="To Activity"),
            details=_input(),
            test_details=_checkbox("Get Details"),
            apply_swap=_checkbox("Apply Swap"),
        ),
    )

    _hide_properties(schema, ["apply_swap"], "validated_details", ["test_details"])

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
                "from_activity",
                "to_activity",
                "details",
                "test_details",
                "validated_details",
                "apply_swap",
            ],
        ),
        from_activity=_make_ui(options=dict(**_space(50))),
        to_activity=_make_ui(options=dict(**_space(50))),
        details=_make_ui(widget="MarkdownRenderWidget"),
        validated_details=_make_ui(),
        test_details=_make_ui(widget="BooleanButtonWidget", options=dict(process_data=True)),
        apply_swap=_make_ui(widget="BooleanButtonWidget", options=dict(process_data=True)),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    if update_field_slug == "root_test_details":
        data["details"] = _swap_everything(mavis, data["from_activity"], data["to_activity"], save=False)
    elif update_field_slug == "root_apply_swap":
        data["details"] = _swap_everything(mavis, data["from_activity"], data["to_activity"], save=True)
    return data


def _swap_everything(mavis, from_activity_id, to_activity_id, save=False):
    mk = []
    if not from_activity_id or not to_activity_id:
        return utils.color("red", "# Missing Activities")

    if from_activity_id == to_activity_id:
        return utils.color("red", "# Same activity")

    from_activity = graph_client.get_activity_dependencies(id=from_activity_id).activity_by_pk

    to_activity = graph_client.get_activity_w_columns(id=to_activity_id).activity
    to_activity_f = {c.name: c for c in to_activity.column_renames}

    # Check if the table is the same
    if from_activity.table_id != to_activity.table_id:
        return utils.color("red", "# Activities cannot be from 2 different streams")

    if save:
        mk.append("# Updated the following dependencies")
    else:
        mk.append("# Found the following dependencies")

    # rerun all materialization of that activity
    for d in from_activity.datasets:
        d_obj = DatasetManager(mavis=mavis).get_config(d.dataset.id)

        use_activity = None
        extra = []
        # swap the activity
        for a in d_obj["query"]["activities"]:
            if from_activity.id in a["activity_ids"] or []:
                use_activity = a
                # Swap the activities
                a["activity_ids"].remove(from_activity.id)
                a["activity_ids"].append(to_activity.id)
                a["slug"].remove(from_activity.slug)
                a["slug"].append(to_activity.slug)

        # help the user know what activities are actually used by things that need to be changed
        if use_activity:
            for f in a.get("filters") or []:
                if f.get("activity_column_name", "").startswith("feature") or f.get("enrichment_table"):
                    extra.append("**Has Pre-filters**")

            for c in d_obj["query"]["columns"]:
                if c["source_details"].get("activity_id") == use_activity["id"]:
                    # Replace the feature label
                    if c.get("name") and c["name"].startswith("feature"):
                        c["label"] = to_activity_f[c["name"]].label or "Not used"

                    if c.get("name") and c["filters"] and c["name"].startswith("feature"):
                        extra.append("**Has Feature filters**")

                    if c["source_details"].get("enrichment_table"):
                        extra.append("**Uses Enrichment**")

        # Add some context on ussage
        last_viewed = "Has never been used"
        if d.dataset.tags:
            t = d.dataset.tags[0]
            last_viewed = f"Last viewed by: {t.company_tag.user.email} {utils.pretty_diff(t.updated_at)}"

        mk.append(
            f" - [{d.dataset.name}]({InternalLink(mavis.company.slug, d.dataset.slug)}) - {', '.join(set(extra))} ({last_viewed})"
        )

        if save:
            # upload the dataset
            DatasetManager(mavis=mavis).update_dataset_config(d.dataset.id, d_obj)
        # rerun all the materializations beting used
        for m in d.dataset.materializations:
            mk.append(f"    - **{m.type.value}** {m.label}")

        # process all the Narratives that are being used
        for n in d.dataset.dependent_narratives:
            mk.append(f"    - **Narrtive** {n.narrative.name}")

    return "\n".join(mk)


def run_data(mavis: Mavis, data: dict):
    content = []
    return [dict(type="markdown", value="\n".join(content))]
