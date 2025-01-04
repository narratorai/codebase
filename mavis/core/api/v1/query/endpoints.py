# TODO create core.models.query (v4?) for the output models

import unicodedata

from fastapi import APIRouter, Depends, Response

from core.api.auth import get_current_company, get_mavis
from core.api.customer_facing.sql.utils import WarehouseManager
from core.errors import ForbiddenError
from core.models.company import Company
from core.util.tracking import fivetran_track
from core.utils import safe_format
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import CONFIG, DATE_SECONDS, FUNCTIONS

from .models import (
    AutocompleteResult,
    DownloadInput,
    DownloadOutput,
    QueryResult,
    RunQueryInput,
)

router = APIRouter(prefix="/query", tags=["query"])

FIVETRAN_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/b34e5fd5-7913-438a-993d-2ca3c464dca9"


def ensure_admin_user(mavis: Mavis = Depends(get_mavis)):
    if not mavis.user.is_admin:
        raise ForbiddenError("Only company admins can run SQL queries")


@router.post(
    "/run",
    response_model=QueryResult,
    responses={200: {"content": {"text/CSV": {}}, "description": "The query result as a csv"}},
    dependencies=[Depends(ensure_admin_user)],
)
async def run_query(
    input: RunQueryInput,
    as_csv: bool = False,
    run_live: bool = False,
    cancel: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    """
    We used to allow non-admin users to run SQL. We no longer do, but already have an admin/v1/query endpoint for running in admin user mode.
    So, a tiny bit of access control here to check the user. In the future, we could update the UI to call the admin endpoint with a query param
    to toggle admin user mode, and get rid of this endpoint.
    """
    # get a sample of the data for type
    qm = mavis.qm
    sample_query = qm.Query()

    # HACK - Wrap the current script in parentheses
    if input.input_fields and input.input_fields.get("current_script"):
        input.input_fields["current_script"] = "(\n%s\n)" % safe_format(
            input.input_fields["current_script"], mavis.qm.get_default_fields()
        )

    # we use secret fields and thus I add them to enable the query to compile
    sample_query.add_fields(**{**mavis.qm.get_default_fields(), **(input.input_fields or {})})
    sample_query.add_column(qm.Column(all_columns=True))
    sample_query.set_limit(10_000 if as_csv else input.limit)

    sql_query = unicodedata.normalize("NFKC", input.sql.rstrip())
    # remove the semi colon
    if sql_query and sql_query[-1] == ";":
        sql_query = sql_query[:-1]

    table = qm.Table(sql=sql_query, alias="t")
    sample_query.set_from(table)

    # if run_live is true then don't then update change minutes to not use the cache
    change_minutes = 1 if run_live else None

    if cancel:
        mavis.cancel_query(sample_query.to_query())
        return dict(data=None)

    else:
        data = mavis.run_query(sample_query.to_query(), within_minutes=change_minutes)

    # creates the proper response when you have data
    if as_csv:
        fivetran_track(mavis.user, FIVETRAN_TRACKING_URL, dict(action="downloaded_query"))
        return Response(content=data.to_csv(), media_type="text/CSV")
    else:
        fivetran_track(mavis.user, FIVETRAN_TRACKING_URL, dict(action="ran_query"))
        return dict(data=data.to_old())


@router.post(
    "/download",
    response_model=DownloadOutput,
    responses={200: {"content": {"text/CSV": {}}, "description": "The query result as a csv"}},
)
async def download_query(input: DownloadInput, current_company: Company = Depends(get_current_company)):
    pre_signed_s3_url = current_company.s3.generate_presigned_url(
        http_method="get",
        client_method="get_object",
        params={
            "ResponseContentType": "text/CSV",
            "Key": input.s3_path,
        },
        expires_in=900,
    )

    return dict(pre_signed_s3_url=pre_signed_s3_url)


@router.get(
    "/schema",
    response_model=dict,  # TODO: make it an object
)
async def get_warehouse_schema(mavis: Mavis = Depends(get_mavis)):
    schema = WarehouseManager(mavis=mavis).get_schema(include_columns=True)
    warehouse = dict()
    for s in sorted(schema.schemas):
        warehouse[s] = []
        for t in sorted(schema.tables_for(s), key=lambda t: t.table_name):
            warehouse[s].append(dict(name=t.name, table_name=t.table_name, columns=t.column_names))

    return dict(warehouse=warehouse)


@router.get("/autocomplete", response_model=AutocompleteResult)
async def get_autocomplete(
    warehouse_language: str | None = None,
    current_company: Company = Depends(get_current_company),
    mavis: Mavis = Depends(get_mavis),
):
    # get dataset autocomplete
    all_functions = FUNCTIONS

    # gets the params
    query_language = warehouse_language or current_company.warehouse_language

    # check if the query language exists
    if query_language not in CONFIG.keys():
        raise TypeError(f"Invalid query language: {query_language}")

    # get all the functions
    valid_functions = CONFIG[query_language]

    output = []

    # add all the casting
    for k, val in valid_functions["cast_mapping"].items():
        if k != "structure":
            output.append(
                dict(
                    name="cast_" + k,
                    display_name="cast_" + k,
                    kind="functions",
                    description=f"casts a column to a {k} type",
                    documentation="",
                    sql=valid_functions["cast_mapping"]["structure"].format(definition="${1:column}", cast=val),
                )
            )

    # add timezone
    output.append(
        dict(
            name="convert_timezone",
            display_name="convert_timezone",
            kind="functions",
            description="converts utc to a specified timezone",
            documentation="",
            sql=valid_functions["timezone_structure"].format(definition="${1:column}", timezone="${2:timezone}"),
        )
    )

    # add the json split
    if mavis.qm.config.get("json_structure"):
        output.append(
            dict(
                name="json_column",
                kind="functions",
                display_name="json_column",
                description="Fetch column from json object",
                sql=mavis.qm.config["json_structure"].format(column="${1:column}", key="${2:key}"),
            )
        )

    # for auto input
    for k, v in DATE_SECONDS.items():
        output.append(
            dict(
                name=f"DATE_SECONDS_{k}",
                display_name=f"DATE_SECONDS_{k}",
                kind="functions",
                description="Has the date seconds for the time filters",
                documentation="",
                sql=str(v),
            )
        )

    # add the rest of the columns
    missing = []
    # gets all the functions
    for f in all_functions:
        if f["name"] in valid_functions[f["kind"]].keys():
            # creating the temp object
            temp_obj = {k: v for k, v in f.items() if k not in ("input_fields",)}

            # add the sql
            sql = valid_functions[f["kind"]][f["name"]]

            # replace sql with an ordered field
            temp_obj["sql"] = sql.format(
                **{v["name"]: "${{{}:{}}}".format(ii + 1, v["name"]) for ii, v in enumerate(f["input_fields"])},
                DATE_SECONDS="${{{}:{}}}".format(len(f["input_fields"]) + 1, "DATE_SECONDS_DATEPART"),
            )

            # get the functions and remove the the fields
            output.append(temp_obj)

        else:
            missing.append(f)

    descriptions = dict(
        from_sync_time="the FROM time of the incremental update of this transformation. Useful for inner query optimization",
        to_sync_time="the TO time of the incremental update of this transformation. Useful for inner query optimization",
        min_date="The minimum data to allow updates.  Set via company config or 1900-01-01",
        max_date="Tomorrow.  Narrator doesn't allow future update unless specified in processing config",
        count_comment="Puts a `--` in here when trying to count how many rows are there in the data.  Useful for removing window functions or expensive aggregations to better decimate the data to insert it",
        count_ignore="Puts a ` and 1<>1` in here when trying to count how many rows are there in the data.  Useful for removing window functions or expensive aggregations to better decimate the data to insert it",
    )

    all_fields = [__make_field_dict(k, descriptions.get(k, "")) for k in mavis.qm.get_default_fields().keys()]
    all_fields.append(__make_field_dict("current_script", "The main SQL query for the transformation"))

    # creates the object
    return dict(all_functions=output, missing=missing, all_fields=all_fields)


def __make_field_dict(k, descrip):
    return dict(
        name=k,
        display_name=k,
        kind="field_variable",
        description=descrip,
        sql=k,
    )
