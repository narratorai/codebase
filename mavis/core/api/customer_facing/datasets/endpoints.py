from typing import Literal

from fastapi import Depends, Response, status

from core.api.auth import get_current_user, get_mavis
from core.api.customer_facing.utils.pydantic import ShareInput, Tags
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.models.ids import UUIDStr
from core.models.table import ColumnTypeEnum, DisplayFormatEnum, TableData
from core.models.user import AuthenticatedUser
from core.v4.dataset_comp.integrations.model import CSVDetails, GsheetDetails, Materialization, MaterializationTypeEnum
from core.v4.dataset_comp.integrations.runner import get_proccessor
from core.v4.dataset_comp.query.model import (
    ActivityColumns,
    ComputedDetails,
    DatasetObject,
    DetailKindEnum,
    ParentColumn,
    PlotDefinition,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import AntVPlot, DatasetPlot, _map_data
from core.v4.mavis import Mavis

from .models import (
    ColumnValues,
    DatasetCount,
    DatasetDuplicateOutput,
    DatasetIntegration,
    DatasetProperties,
    DatasetTable,
    DatasetVersions,
    DatasetWithRows,
    DownloadCSVDatasetOutput,
    DuplicateInput,
    GetDatasetOutput,
    QueryParams,
)
from .router import router
from .utils import DatasetManager, DatasetQueryBuilder, DatasetUpdator


@router.get(
    "",
    response_model=GetDatasetOutput,
    name="Get all datasets",
    description="Get all datasets of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.view_dataset)
    query_builder = DatasetQueryBuilder(**params.dict(), user=current_user)
    return query_builder.get_results()


@router.post("/{id}/favorite", response_model=None, status_code=status.HTTP_201_CREATED)
async def favorite_dataset(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DatasetUpdator(user=current_user).favorite(id)

    return {"id": id}


@router.delete("/{id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_dataset(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DatasetUpdator(user=current_user).unfavorite(id)


@router.patch(
    "/{id}/share",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a dataset with the teams you now want to share with",
    description="Update a dataset with the teams you now want to share with",
)
async def update_teams_to_share_with(
    id: UUIDStr,
    input: ShareInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DatasetUpdator(user=current_user).update_permissions(
        id, input.permissions, share_with_everyone=input.share_with_everyone
    )
    return None


@router.patch(
    "/{id}/tags",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a dataset with the teams you now want to share with",
    description="Update a dataset with the teams you now want to share with",
)
async def update_tags(
    id: UUIDStr,
    input: Tags,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DatasetUpdator(user=current_user).update_tags(id, input.tags)
    return None


@router.get(
    "/{id}",
    response_model=DatasetObject,
    name="Get dataset",
    description="Get the dataset object",
)
async def get_dataset(
    id: str,
    version_id: UUIDStr | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    dm = DatasetManager(user=mavis.user)
    dm.check_get_permissions(id, dm.get_created_by(id))
    return Dataset(mavis=mavis, id=id, version_id=version_id).model.dict()


@router.patch(
    "/{id}",
    response_model=DatasetProperties,
    name="Update a dataset properties",
    description="Update a dataset properties",
)
async def update_dataset(
    id: str,
    input: DatasetProperties,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    dm = DatasetManager(user=current_user)
    dm.check_update_permissions(id)
    dm.update(id, **input.dict())
    return input


@router.patch(
    "/{id}/config",
    response_model=DatasetObject,
    name="Update a dataset config",
    description="Update a dataset config",
)
async def update_dataset_config(
    id: str,
    input: DatasetObject,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DatasetManager(user=current_user).update_dataset_config(id, input)
    return input


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Delete dataset",
    description="Delete the dataset",
)
async def delete_dataset(
    id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DatasetManager(user=current_user).delete(id)


@router.post(
    "/{id}/duplicate",
    response_model=DatasetDuplicateOutput,
    name="Duplicate dataset",
    description="Duplicate the dataset",
)
async def duplicate_dataset(
    id: str,
    input: DuplicateInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return DatasetManager(user=current_user).duplicate(id, input.name)


@router.post(
    "",
    response_model=DatasetObject,
    name="Create a new dataset",
    description="Create a new dataset",
)
async def create_dataset(
    input: DatasetObject,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ds = DatasetManager(user=current_user)
    new_id = ds.create(input.name, input.description, input.tags).id
    ds.update_dataset_config(new_id, input)
    input.id = new_id
    return input


@router.get(
    "/{id}/versions",
    response_model=DatasetVersions,
    name="Get all the versions of a dataset",
    description="Retrieves all the versions of a dataset",
)
async def get_versions(
    id: UUIDStr,
    per_page: int = 10,
    page: int = 1,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return DatasetManager(user=current_user).versions(id, per_page=per_page, page=page)


@router.get(
    "/{id}/integrations",
    response_model=DatasetIntegration,
    name="Get all the integrations of a dataset",
    description="Retrieves all the integrations of a dataset",
)
async def get_dataset_integrations(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    mats = graph_client.get_dataset_materializations(dataset_id=id).materializations
    dataset_manager = DatasetManager(user=current_user)
    return DatasetIntegration(integrations=[dataset_manager.get_materialization(m.id) for m in mats])


@router.patch(
    "/{id}/integrations/{integration_id}",
    response_model=Materialization,
    name="Get all the integrations of a dataset",
    description="Retrieves all the integrations of a dataset",
)
async def update_dataset_integration(
    id: UUIDStr,
    integration_id: UUIDStr,
    input: Materialization,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return DatasetManager(user=current_user).update_materialization(integration_id, input)


@router.delete(
    "/{id}/integrations/{integration_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Get all the integrations of a dataset",
    description="Retrieves all the integrations of a dataset",
)
async def delete_dataset_integration(
    id: UUIDStr,
    integration_id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return DatasetManager(user=current_user).delete_materialization(integration_id)


def _get_obj(
    id: UUIDStr | Literal["new"], obj: DatasetObject | None, tab_slug: str | None = None
) -> tuple[UUIDStr, DatasetObject | None, str | None]:
    if id == "new":
        id = None

    if tab_slug is None:
        return id, obj

    if tab_slug == "parent":
        tab_slug = None

    return id, obj, tab_slug


@router.post("/{id}/tab/{tab_slug}/run", response_model=DatasetTable)
async def run_dataset(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    input: DatasetObject | None = None,
    run_live: bool = False,
    page: int = 0,
    mavis: Mavis = Depends(get_mavis),
):
    id, obj, tab_slug = _get_obj(id, input, tab_slug)
    ds = Dataset(mavis=mavis, id=id, model=obj)
    data = ds.run(tab_slug, run_live=run_live, offset=page * ds.limit)
    return DatasetTable(data=data, page=page, per_page=ds.limit, total_count=data.total_rows)


@router.post(
    "/{id}/tab/{tab_slug}/download",
    responses={200: {"content": {"application/vnd.ms-excel": {}, "text/CSV": {}}}},
)
async def download_in_app_data(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    input: DatasetObject | None = None,
    format: Literal["csv", "xls"] = "csv",
    mavis: Mavis = Depends(get_mavis),
):
    mavis.user.require_role(access_role_enum.download_data)

    id, obj, tab_slug = _get_obj(id, input, tab_slug)
    data = Dataset(mavis=mavis, id=id, model=obj).run(tab_slug)

    if format == "csv":
        return Response(content=data.to_csv(), media_type="text/CSV")
    else:
        return Response(content=data.to_xls(), media_type="application/vnd.ms-excel")


@router.post(
    "/{id}/tab/{tab_slug}/async_download",
    response_model=DownloadCSVDatasetOutput,
)
async def request_async_download(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    input: DatasetObject | None = None,
    format: Literal["csv", "xls"] = "csv",
    mavis: Mavis = Depends(get_mavis),
):
    mavis.user.require_role(access_role_enum.download_data)
    from batch_jobs.data_management.materialize_dataset import materialize_dataset

    id, obj, tab_slug = _get_obj(id, input, tab_slug)

    ds = DatasetManager(user=mavis.user)
    if id is None:
        id = ds.create(name=input.name, hide_from_index=True).id
        ds.update_dataset_config(id, obj)
        name = obj.name
    else:
        name = ds.get(id).name

    materialization = Materialization(
        label=name,
        type=MaterializationTypeEnum.csv,
        dataset_id=id,
        tab_slug=tab_slug,
        details=CSVDetails(
            user_ids=[mavis.user.id],
            format=format,
        ),
    )
    materialize_dataset.send(company_slug=mavis.company.slug, materialization_attrs=materialization.dict())
    return dict(scheduled=True, message="We have scheduled the dataset to be downloaded")


@router.post(
    "/{id}/tab/{tab_slug}/send_to_gsheet",
    response_model=DownloadCSVDatasetOutput,
)
async def send_to_gsheet(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    input: DatasetObject | None = None,
    sheet_key: str | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    mavis.user.require_role(access_role_enum.download_data)
    from batch_jobs.data_management.materialize_dataset import materialize_dataset

    id, obj, tab_slug = _get_obj(id, input, tab_slug)

    ds = DatasetManager(user=mavis.user)
    if id is None:
        id = ds.create(name=input.name, hide_from_index=True).id
        ds.update_dataset_config(id, obj)
        name = obj.name
    else:
        name = ds.get(id).name

    materialization = Materialization(
        label=name,
        type=MaterializationTypeEnum.gsheets,
        dataset_id=id,
        tab_slug=tab_slug,
        details=GsheetDetails(
            sheet_key=sheet_key,
        ),
    )
    get_proccessor(materialization).validate(materialization)
    materialize_dataset.send(company_slug=mavis.company.slug, materialization_attrs=materialization.dict())
    return dict(scheduled=True, message="We have scheduled the dataset to be downloaded")


@router.post("/{id}/tab/{tab_slug}/plot/{plot_slug}/run", response_model=AntVPlot)
async def run_plot(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    plot_slug: str | None = None,
    input: DatasetObject | None = None,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    id, obj, tab_slug = _get_obj(id, input, tab_slug)
    ds = Dataset(mavis=mavis, id=id, model=obj)
    plotter = DatasetPlot(config=dict(dataset=dict(tab_slug=tab_slug, plot_slug=plot_slug)), dataset=ds)
    return plotter.run_plot(run_live=run_live)


@router.post("/{id}/tab/{tab_slug}/plot", response_model=PlotDefinition)
async def create_new_plot(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    input: DatasetObject | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    id, obj, tab_slug = _get_obj(id, input, tab_slug)
    ds = Dataset(mavis=mavis, id=id, model=obj)
    plotter = DatasetPlot(config=dict(dataset=dict(tab_slug=tab_slug)), dataset=ds)
    plotter.reset_axis()
    return plotter.get_config()


@router.post(
    "/{id}/tab/{tab_slug}/count",
    response_model=DatasetCount,
    name="Get the count of rows in a dataset",
    description="Get the count of rows in a dataset",
)
async def get_dataset_count(
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    input: DatasetObject | None = None,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    id, obj, tab_slug = _get_obj(id, input, tab_slug)
    ds = Dataset(mavis=mavis, id=id, model=obj)
    return dict(count=ds.count_rows(tab_slug, run_live=run_live))


@router.post(
    "/{id}/tab/{tab_slug}/column/{column_id}/values",
    response_model=ColumnValues,
    name="Gets values",
    description="Gets all the values for a column (used in merics and pivot)",
)
async def get_values(
    id: UUIDStr | Literal["new"],
    tab_slug: str,
    column_id: str,
    input: DatasetObject | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    id, obj = _get_obj(id, input)
    ds = Dataset(mavis=mavis, id=id, model=obj)
    # get the tab and column
    data = ds.run(tab_slug)
    return dict(values=data.column_values(data.column(column_id)))


@router.post(
    "/{id}/tab/parent/column/{column_id}/metrics",
    response_model=AntVPlot,
    name="Gets metrics",
    description="Gets all the metrics for a column",
)
async def get_column_metrics(
    id: UUIDStr | Literal["new"],
    column_id: str = None,
    input: DatasetObject | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    if column_id is None:
        raise ValueError("column_id is required")

    id, obj = _get_obj(id, input)
    ds = Dataset(mavis=mavis, id=id, model=obj)
    col = ds.model.column(column_id)

    if col is None:
        raise ValueError(f"Column {column_id} not found")

    if col.type == ColumnTypeEnum.timestamp:
        new_col = ParentColumn(
            label="week",
            type=ColumnTypeEnum.timestamp,
            display_format=DisplayFormatEnum.date,
            details=ComputedDetails(
                raw_str=f"date_trunc('week', {col.id})",
            ),
        )
        ds.model.columns.append(new_col)
        col = new_col
    elif col.type == ColumnTypeEnum.number and not (
        col.details.kind == DetailKindEnum.activity and col.details.name == ActivityColumns.activity_occurrence
    ):
        new_col = ParentColumn(
            label=f"bucked {col.label}",
            type=ColumnTypeEnum.number,
            display_format=col.display_format,
            details=ComputedDetails(
                raw_str=f"decimate_number({col.id}, 1)",
            ),
        )
        ds.model.columns.append(new_col)
        col = new_col
    elif col.details.kind == DetailKindEnum.activity and (
        "id" in col.details.name.lower().split()
        or col.details.name in (ActivityColumns.customer, ActivityColumns.join_customer, "email")
    ):
        new_col = ParentColumn(
            label=f"{col.label} is Null",
            display_format=DisplayFormatEnum.boolean,
            type=ColumnTypeEnum.boolean,
            details=ComputedDetails(
                raw_str=f"is_null({col.id})",
            ),
        )
        ds.model.columns.append(new_col)
        col = new_col

    tab = ds.model.add_group(column_ids=[col.id])

    plotter = DatasetPlot(dict(dataset=dict(tab_slug=tab.slug)), dataset=ds)
    return plotter.run_plot(use_last_available=True)


@router.post(
    "/{id}/tab/{tab_slug}/plot/{plot_slug}/drill",
    response_model=TableData,
    name="Drill down into a plot",
    description="Drill down into a plot",
)
async def drill_into_plot(
    input: DatasetWithRows,
    id: UUIDStr | Literal["new"],
    tab_slug: str = "parent",
    plot_slug: str = "new",
    mavis: Mavis = Depends(get_mavis),
):
    id, obj, tab_slug = _get_obj(id, input.dataset, tab_slug)
    ds = Dataset(mavis=mavis, id=id, model=obj)

    # get the data running
    plot_data = ds.run(tab_slug)
    plot = DatasetPlot(config=dict(dataset=dict(tab_slug=tab_slug, plot_slug=plot_slug)), dataset=ds)

    # convert the plot row to a dataset row
    row, select_column_id = _map_data(input.plot_row, plot.cols, plot_data)

    # create the new tab
    new_tab = ds.model.drill_into(tab_slug, row, select_column_id)

    # return the new tab
    return ds.run(new_tab.slug)
