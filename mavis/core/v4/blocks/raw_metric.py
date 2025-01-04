from core.graph import graph_client
from core.v4.analysisGenerator import fields_to_autocomplete
from core.v4.blocks.shared_ui_elements import (
    _drop_down,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

TITLE = "Dashboard Metric"
DESCRIPTION = "Creates a dashboard metric"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    all_datasets = internal_cache["all_datasets"] or []
    groups = internal_cache["groups"] or []

    autocomplete = internal_cache["autocomplete"] or []
    schema = _object(
        dict(
            metrics=_make_array(
                dict(
                    header=_input("Metric Description"),
                    title=_input("Title"),
                    value=_input("Value"),
                    description=_input("Sub-Text"),
                    dataset_slug=_drop_down(all_datasets, "slug", "name", title="Dataset"),
                    group_slug=_drop_down(groups, "slug", "name", title="Groups"),
                ),
                required=["header", "title", "value"],
            ),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    schema_ui = dict(
        **_make_ui(options=dict(hide_output=True)),
        metrics=dict(
            items=dict(
                **_make_ui(
                    options=dict(hide_output=True),
                    order=[
                        "title",
                        "value",
                        "description",
                        "header",
                        "dataset_slug",
                        "group_slug",
                    ],
                ),
                value=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=42),
                ),
                description=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=42),
                ),
                header=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=42),
                ),
                title=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=42),
                ),
                dataset_slug=_make_ui(options=dict(update_schema=True, **_space(50))),
                group_slug=_make_ui(options=_space(50)),
            ),
        ),
    )
    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    if not internal["autocomplete"] and data["_raw_fields"]:
        internal["autocomplete"] = [
            fields_to_autocomplete(
                mavis,
                data["_raw_fields"],
                include_pretty=True,
            )
        ]

    # handle datasets
    if not internal["all_datasets"]:
        internal["all_datasets"] = [
            dict(slug=d.slug, name=d.name) for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
        ]

    if data["metrics"][-1]["dataset_slug"]:
        d_obj = Dataset(mavis, data["metrics"][-1]["dataset_slug"])

        internal["groups"] = [{"slug": g.slug, "name": g.label} for g in d_obj.model.all_tabs]
        internal["groups"].append(dict(slug="none", name="Parent Dataset"))

    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    if not data["metrics"]:
        data["metrics"] = [
            dict(
                header="ex. Last 30 day signups",
                title="ex. Total Leads",
                value="##",
                description="details on the metric",
                dataset_slug=None,
            )
        ]

    return data


def run_data(mavis: Mavis, data: dict):
    for m in data["metrics"]:
        if "mavis-error" in str(m["value"]):
            m["value"] = "ERROR"

    return [dict(type="raw_metric", value=data["metrics"])]
