from contextlib import contextmanager

from fastapi import APIRouter, Depends, status

from batch_jobs.data_bridging.grant_missing_access import grant_missing_access
from core.api.auth import get_current_company, get_current_user, get_mavis
from core.api.customer_facing.warehouses.helpers import create_datasource, mask_options
from core.errors import InvalidPermission
from core.graph import graph_client
from core.graph.sync_client.enums import company_config_warehouse_language_enum
from core.models.company import Company, query_graph_company
from core.models.user import AuthenticatedUser
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import CONFIG

from .models import (
    CreateInput,
    DatasourceOption,
    Datasources,
    SaveOutput,
)

router = APIRouter(prefix="/warehouses", tags=["warehouse"])


@contextmanager
def warehouse_action(current_user: AuthenticatedUser):
    if not current_user.is_admin:
        raise InvalidPermission("You must be an admin to perform this action")

    # run the function
    yield

    # reset the cache to ensure the user is good
    query_graph_company(current_user.company.slug, refresh_cache=True)
    grant_missing_access.send(company_slug=current_user.company.slug)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source_internal(is_admin: bool = False, current_company: Company = Depends(get_current_company)):
    """Deletes the data source."""
    with warehouse_action(current_company.current_user):
        current_company._delete_secret(f"{current_company.warehouse_language}{'_admin' if is_admin else ''}")

        # if status is removed then go back to onboarding
        if not is_admin:
            graph_client.update_company_status(company_id=current_company.id, status="onboarding")


@router.get("", response_model=Datasources)
async def get_datasources(
    warehouse_language: company_config_warehouse_language_enum | None = None,
    current_company: Company = Depends(get_current_company),
):
    """Get the internal connected warehouses."""
    if not current_company.current_user.is_admin:
        raise InvalidPermission("You must be an admin to perform this action")

    # handle enum
    if warehouse_language:
        warehouse_language = warehouse_language.value
    else:
        warehouse_language = current_company.warehouse_language

    ds = CONFIG[warehouse_language]["query_runner"]
    options = current_company.load_secret(warehouse_language)

    admin_options = current_company.load_secret(f"{warehouse_language}_admin")

    return dict(
        data_source=dict(
            id="primary_warehoue",
            name="Primary Warehouse",
            type=warehouse_language,
            options=mask_options(options),
            config=ds.configuration_schema(),
        ),
        admin_data_source=dict(
            id="admin_warehouse",
            name="Admin Warehouse",
            type=warehouse_language,
            is_admin=True,
            options=mask_options(admin_options),
            config=ds.configuration_schema(),
        ),
    )


@router.get("/options", response_model=list[DatasourceOption])
async def get_data_source_options(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a list of all the supported warehouses."""
    valid_datasources = [
        "redshift",
        "bigquery",
        "pg",
        "snowflake",
        "mssql_odbc",
        "databricks",
    ]

    return_data = []

    for v in valid_datasources:
        ds = CONFIG[v]["query_runner"]

        # Add the data needed
        return_data.append(dict(type=v, name=ds.name(), config=ds.configuration_schema()))

    return return_data


@router.post("", response_model=SaveOutput)
async def create_the_datasource(
    input: CreateInput,
    mavis: Mavis = Depends(get_mavis),
):
    with warehouse_action(mavis.company.current_user):
        (was_admin, options) = create_datasource(mavis, input.type.value, input.options, input.is_admin)
        input.options = options

    return dict(
        success=True,
        was_admin=was_admin,
        message=f'{"Created Narrator User, " if was_admin else ""}Successfully connected and saved',
        **input.dict(),
    )
