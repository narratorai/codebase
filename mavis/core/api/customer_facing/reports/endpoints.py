import base64
from typing import Annotated

from fastapi import Depends, Query, status, Response

from core.api.auth import get_current_company, get_current_user, get_mavis
from core.api.customer_facing.datasets.utils import DatasetQueryBuilder
from core.api.customer_facing.reports.helpers import get_node
from core.api.customer_facing.reports.utils import async_log_filter_use
from core.api.customer_facing.utils.pydantic import ShareInput, Tags
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.table import _external_dict
from core.models.time import today
from core.models.user import AuthenticatedUser
from core.util.email import send_email
from core.v4.mavis import Mavis

from .models import (
    CompileInput,
    CompileOutput,
    CreateReportInput,
    CreateReportOutput,
    DownloadInput,
    GetReportQueryParams,
    GetReportsOutput,
    NarrativeGet,
    NarrativeRuns,
    NarrativeSchedule,
    NarrativeVersions,
    QueryParams,
    RunDetails,
    SendReportEmail,
    UpdateReportContentIO,
    UsedDataset,
    UsedDatasetsResponse,
)
from .router import router
from .utils import NarrativeManager, NarrativeQueryBuilder, NarrativeUpdator


@router.get(
    "",
    response_model=GetReportsOutput,
    name="Get all reports",
    description="Get all reports of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
    current_company: Company = Depends(get_current_company),
):
    current_user.require_role(access_role_enum.view_report)
    query_builder = NarrativeQueryBuilder(**params.dict(), user=current_user, company=current_company)
    return query_builder.get_results()


@router.get("/{id}", response_model=NarrativeGet, name="Get a report")
async def get_item(
    id: UUIDStr,
    query_params: Annotated[GetReportQueryParams, Query()],
    current_company: Company = Depends(get_current_company),
):
    narrative_manger = NarrativeManager(company=current_company)
    output = narrative_manger.get_with_content(id, query_params.version_id)
    narrative_manger.log_view(id)
    narrative_manger.check_get_permissions(output.team_permissions, output.created_by)
    return output


@router.post("", response_model=CreateReportOutput, name="Create a new report")
async def create(
    input: CreateReportInput,
    current_company: Company = Depends(get_current_company),
):
    narrative_manger = NarrativeManager(company=current_company)
    narrative_manger.check_create_permissions()
    report = narrative_manger.create(**input.dict())
    return dict(id=report.id, name=report.name, updated_at=report.updated_at, updated_by=current_company.user.id)


@router.patch("/{id}", response_model=CreateReportOutput, name="Update a metadata of a report")
async def update(
    id: UUIDStr,
    input: CreateReportInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    narrative_manger = NarrativeManager(user=current_user)
    narrative_manger.check_update_permissions(id)
    changes = narrative_manger.update(id, name=input.name, description=input.description)
    return {**input.dict(), **changes, "id": id}


@router.delete("/{id}", name="Delete a report", status_code=status.HTTP_204_NO_CONTENT)
async def delete(id: UUIDStr, current_user: AuthenticatedUser = Depends(get_current_user)):
    narrative_manger = NarrativeManager(user=current_user)
    narrative_manger.check_update_permissions(id)
    narrative_manger.delete(id)


@router.patch("/{id}/content", response_model=UpdateReportContentIO, name="Update the content of a report")
async def update_content(
    id: UUIDStr,
    input: UpdateReportContentIO,
    current_company: Company = Depends(get_current_company),
):
    narrative_manger = NarrativeManager(company=current_company)
    narrative_manger.check_update_permissions(id)
    updated_by = narrative_manger.update_report_config(id, input.content.dict())
    return {**input.dict(), "notify_overlap_updated_by": updated_by}


@router.post("/{id}/send", status_code=status.HTTP_204_NO_CONTENT, name="Send a report to an email")
async def send_report_email(
    id: UUIDStr,
    input: SendReportEmail,
    current_company: Company = Depends(get_current_company),
):
    # get the narrative
    narrative_manger = NarrativeManager(company=current_company)
    nar = narrative_manger._get_basic(id)
    # download the report
    content = narrative_manger.download_report(id, "pdf", input.run_details)

    config = narrative_manger.get_config(id)
    narrative_manger._update_text_with_data(config)

    breakdown = narrative_manger.breakdown_content(config["text"])

    # create the attachments
    attachments = [
        dict(
            Name=f"{nar.name}-{today()}.pdf",
            Content=base64.b64encode(content).decode("utf-8"),
            ContentType="application/pdf",
        )
    ]
    # create the model
    model = dict(
        sender_email=current_company.user.email,
        name=nar.name,
        created_by=nar.created_by,
        created_at=nar.created_at,
        report_id=id,
        summary=breakdown.summary,
        key_takeaways=breakdown.key_takeaways,
    )

    user = graph_client.get_user(input.user_id).user_by_pk
    # send the email
    send_email(current_company, user.email, "37899782", model, tag="report-email", attachments=attachments)
    return None


@router.post("/{id}/favorite", response_model=None, status_code=status.HTTP_201_CREATED)
async def favorite_dataset(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    NarrativeUpdator(user=current_user).favorite(id)
    return {"id": id}


@router.delete("/{id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_dataset(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    NarrativeUpdator(user=current_user).unfavorite(id)


@router.patch(
    "/{id}/schedule",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a report with the schedule",
    description="Update a report with the schedule",
)
async def update_schedule(
    id: UUIDStr,
    input: NarrativeSchedule,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    NarrativeManager(user=current_user).update_schedule(id, input.cron_schedule, input.label)


@router.patch(
    "/{id}/share",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a report with the teams you now want to share with",
    description="Update a report with the teams you now want to share with",
)
async def update_teams_to_share_with(
    id: UUIDStr,
    input: ShareInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    NarrativeUpdator(user=current_user).update_permissions(
        id, input.permissions, share_with_everyone=input.share_with_everyone
    )
    return None


@router.patch(
    "/{id}/tags",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a report with the teams you now want to share with",
    description="Update a report with the teams you now want to share with",
)
async def update_tags(
    id: UUIDStr,
    input: Tags,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    NarrativeUpdator(user=current_user).update_tags(id, input.tags)
    return None


@router.post(
    "/{id}/nodes/{node_id}/compile",
    response_model=dict,
    name="Compiles a report node",
    description="Compiles a single node (plot, metric, or table) of a report",
)
async def compile_node(
    id: UUIDStr,
    node_id: str,
    input: CompileInput,
    mavis: Mavis = Depends(get_mavis),
):
    input.run_details.id = id
    node = get_node(mavis, node_id, input.node.type, input.node.attrs, input.run_details)
    if input.run_details.applied_filters:
        async_log_filter_use.send(mavis.company.slug, input.run_details.dict()["applied_filters"], id)

    if node is None:
        raise ValueError("Invalid node type")
    return _external_dict(CompileOutput(type=input.node.type, content=node.run()))


# CLEAN UP BELOW
@router.post(
    "/{id}/run",
    response_model=RunDetails,
    name="Compiles a report",
    description="Compiles a report",
)
async def run_narrative(
    id: UUIDStr,
    company: Company = Depends(get_current_company),
):
    run_details = NarrativeManager(company=company).run(id)

    return run_details


@router.get(
    "/{id}/datasets",
    response_model=UsedDatasetsResponse,
    name="Gets the datasets in the report",
    description="Gets the datasets in the report",
)
async def get_datasets(
    id: UUIDStr,
    mavis: Company = Depends(get_mavis),
):
    datasets = NarrativeManager(mavis=mavis).get_datasets(id)
    datasets_ids = [d[0] for d in datasets]
    query_builder = DatasetQueryBuilder(mavis=mavis, ids=datasets_ids)
    results = query_builder.get_results()

    # get all the datasets used via search
    wrapped_data = {item["id"]: item for item in results["data"]}
    data = [UsedDataset(dataset=wrapped_data[item[0]], tab_slugs=item[1]) for item in datasets if item[0] != ""]

    return UsedDatasetsResponse(total_count=results["total_count"], data=data)


@router.get(
    "/{id}/versions",
    response_model=NarrativeVersions,
    name="Gets all the versions of a report",
    description="gets all the versions of a report",
)
async def get_versions(
    id: UUIDStr,
    per_page: int = 10,
    page: int = 1,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return NarrativeManager(user=current_user).versions(id, per_page=per_page, page=page)


@router.get(
    "/{id}/runs",
    response_model=NarrativeRuns,
    name="Gets all the Runs of a report",
    description="gets all the runs of a report",
)
async def get_runs(
    id: UUIDStr,
    per_page: int = 10,
    page: int = 1,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return NarrativeManager(user=current_user).get_runs(id, per_page=per_page, page=page)


@router.post(
    "/{id}/export",
    name="Export report",
    description="Export a report as PDF or PNG",
    response_class=Response,
)
async def export_report(
    id: UUIDStr,
    input: DownloadInput,
    current_company: Company = Depends(get_current_company),
):
    narrative_manager = NarrativeManager(company=current_company)
    name = narrative_manager.get(id).name
    content = narrative_manager.download_report(id, input.format, input.run_details)

    media_type = "application/pdf" if input.format == "pdf" else "image/png"
    filename = f"{name}-{today()}.{input.format}"

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return Response(content=content, media_type=media_type, headers=headers)
