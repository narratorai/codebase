import mimetypes
from itertools import product
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from core import utils
from core.api.auth import get_mavis
from core.api.customer_facing.datasets.utils import DatasetManager
from core.models.ids import get_uuid
from core.models.table import TableData
from core.v4.dataset_comp.query.model import DetailKindEnum, GroupColumn, TabKindEnum
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import get_required_fields
from core.v4.query_mapping.config import RESOLUTIONS

router = APIRouter(prefix="/narrative/content", tags=["narrative"])


class PlotResult(BaseModel):
    slug: str
    name: str


class GroupResults(BaseModel):
    slug: str
    name: str
    is_parent: bool = False
    plots: list[PlotResult]
    additional_autocomplete: list[dict]


class MetricInputs(BaseModel):
    input_fields: dict = Field(..., alias="fields")
    dataset_slug: str
    group_slug: str


class Column(BaseModel):
    id: str
    label: str


class FilterOption(BaseModel):
    column_id: str
    value: str | dict = None


class MetricOption(BaseModel):
    filters: list[FilterOption]
    label: str


class MetricOptions(BaseModel):
    all_metrics: list[Column]
    metric_options: list[MetricOption]


class MediaUploadOutput(BaseModel):
    slug: str


@router.get("/get_dataset_groups", response_model=list[GroupResults])
async def get_dataset_groups(
    slug: str,
    mavis: Mavis = Depends(get_mavis),
):
    output = []
    dataset_updator = DatasetManager(mavis=mavis)
    dataset_id = dataset_updator._slug_to_id(slug)
    d_obj = Dataset(mavis, dataset_id)

    for tab in d_obj.model.all_tabs:
        all_plots = []

        for p in tab.plots:
            all_plots.append(
                dict(
                    slug=f"{tab.slug}.{p.slug}",
                    name=p.name,
                )
            )

        # Get all the cols
        all_cols = tab.output_columns
        additional_autocomplete = [
            dict(
                label=c.clean_label,
                insertText=c.clean_label,
            )
            for c in all_cols
        ]

        output.append(
            dict(
                slug=tab.slug,
                name=tab.label,
                is_parent=tab.kind == TabKindEnum.parent,
                plots=all_plots,
                additional_autocomplete=additional_autocomplete,
            )
        )

    return output


@router.post("/get_metric_options", response_model=MetricOptions)
async def get_metrics(input: MetricInputs, mavis: Mavis = Depends(get_mavis)):
    return _get_metrics(mavis, input.dataset_slug, input.group_slug, input.input_fields)


@router.post("/media", response_model=MediaUploadOutput)
async def upload_media(file: Annotated[UploadFile, File()], mavis: Mavis = Depends(get_mavis)):
    data = await file.read()
    file_extension = mimetypes.guess_extension(file.content_type or "application/octet-stream")
    obj_name = f"{utils.slugify(file.filename)}_{get_uuid()[:8]}{file_extension}"
    mavis.company.s3.upload_object(data, ["media", obj_name])

    return dict(slug=obj_name)


@router.get("/media/{file_name}")
async def fetch_media(file_name: str, mavis: Mavis = Depends(get_mavis)):
    if file := mavis.company.s3.get_file(["media", file_name]):
        media_type, content = file
        return Response(content=content, media_type=media_type)
    else:
        raise HTTPException(status_code=404, detail="File not found")


def _get_metrics(mavis, dataset_slug: str, group_slug: str, input_fields, add_metrics=True):
    metric_options = []
    dataset_updator = DatasetManager(mavis=mavis)
    dataset_id = dataset_updator._slug_to_id(dataset_slug)
    d_obj = Dataset(mavis, dataset_id)
    tab = d_obj.model.tab(group_slug)
    # hand no groups
    if not tab:
        raise ValueError(f"Missing group {group_slug}")

    # get the group columns
    group_cols = tab.get_columns(DetailKindEnum.group, True)

    non_group_columns = [c for c in tab.output_columns if c.details.kind != DetailKindEnum.group]

    ngcm = {c.id: c for c in non_group_columns}

    all_metrics = [dict(id=c.id, label=c.label) for c in non_group_columns]

    # deal with the simple case
    if len(group_cols) > 0:
        # get all the used fields
        used_fields = get_required_fields(tab)

        # process the data
        raw_data = d_obj.run(group_slug)

        valid_values = []

        for g in group_cols:
            current_vs = []

            for k in _get_valid_fields(mavis, g, raw_data, input_fields, used_fields):
                current_vs.append(f"{{{k}}}")

            # get all the values
            all_values = raw_data.column_values(raw_data.column(g.id))

            # add valid options in the data or add anything if there are no fields
            if len(all_values) <= 10 or len(current_vs) == 0:
                current_vs.extend(all_values)

            current_vs = list(set(current_vs))
            # add conditions on metrics
            if add_metrics:
                for c in non_group_columns:
                    for agg in ("max", "min"):
                        if c.type == "number":
                            current_vs.append(dict(column_id=c.id, value=agg))

            valid_values.append(current_vs)

        # Create all the filters``
        for filts in product(*valid_values):
            # All aggs is confusing so I am removing it
            if all(isinstance(f, dict) for f in filts):
                continue

            # create the filters
            filters = [
                dict(
                    column_id=gc.id,
                    value=filts[kk],
                    display=_display_filt(filts[kk], gc, ngcm),
                )
                for kk, gc in enumerate(group_cols)
            ]

            # create a pretty name
            metric_options.append(
                dict(
                    filters=filters,
                    label=" & ".join(f["display"] for f in filters),
                )
            )

        # add the aggregations
        if add_metrics:
            for c in non_group_columns + group_cols:
                metric_options.extend(
                    [
                        dict(
                            filters=[dict(column_id=c.id, value="first_non_null")],
                            label=f"First Non-Null {c.label}",
                        ),
                        dict(
                            filters=[dict(column_id=c.id, value="last_non_null")],
                            label=f"Last Non-Null {c.label}",
                        ),
                        dict(
                            filters=[dict(column_id=c.id, value="second_non_null")],
                            label=f"Second Non-Null {c.label}",
                        ),
                        dict(
                            filters=[dict(column_id=c.id, value="second_last_non_null")],
                            label=f"Second Last Non-Null {c.label}",
                        ),
                    ]
                )

                for agg in ("max", "min"):
                    if utils.same_types(c.type, "number"):
                        metric_options.append(
                            dict(
                                filters=[dict(column_id=c.id, value=agg)],
                                label=_display_filt(agg, c, ngcm),
                            )
                        )

                for k in _get_valid_fields(mavis, c, raw_data, input_fields, used_fields):
                    filt = dict(column_id=c.id, value=f"{{{k}}}")
                    metric_options.append(
                        dict(
                            filters=[filt],
                            label=_display_filt(filt["value"], c, ngcm),
                        )
                    )

        # add an empty array
        if len(metric_options) == 0:
            metric_options.append(
                dict(
                    filters=[],
                    label="Limit 1 (First Row)",
                )
            )

    return dict(
        all_metrics=all_metrics,
        metric_options=metric_options,
        query_obj=d_obj.query,
        group_cols=group_cols,
        non_group_columns=non_group_columns,
    )


def _get_valid_fields(mavis: Mavis, col: GroupColumn, raw_data: TableData, input_fields, used_fields):
    valid_fields = []
    # get the column
    all_values = raw_data.column_values(raw_data.column(col.id))

    # check if any field is valid
    for k, v in input_fields.items():
        if k[0] not in ("#", "_"):
            if v in all_values or v in used_fields:
                valid_fields.append(k)

            # added handling of timestamp for last month or so
            elif col.type == "timestamp":
                for r in RESOLUTIONS:
                    if r in k and r in col.clean_label:
                        valid_fields.append(k)
                        break

    return valid_fields


def _display_filt(filt, gc, ngcm):
    if isinstance(filt, dict) and filt.get("value") in ("max", "min"):
        return f"{gc.label} of {filt['value']}({ngcm[filt['column_id']].label})"

    # # agg function filter
    if str(filt) in {"max", "min"}:
        return f"{filt}({gc.label})"
    # fields as variables
    elif str(filt).startswith("{"):
        return f"{gc.label} = {filt}"
    # normal values
    else:
        return f"{gc.label} = {filt}"
