import re

from fastapi import APIRouter, Depends, status

from core.api.auth import get_current_company, get_current_user, get_mavis
from core.api.customer_facing.utils.pydantic import ShareInput
from core.errors import ForbiddenError
from core.models.company import Company
from core.models.user import AuthenticatedUser
from core.models.warehouse_schema import TableSchema
from core.util.llm import ask_gpt
from core.v4.mavis import Mavis

from .models import (
    ConvertToDimInput,
    EndpointAlert,
    GetSchemaOutput,
    QueryInput,
    QueryParams,
    SchemaList,
    SQLComponentsResponse,
    SQLQuery,
    SQLQueryAutocomplete,
    SQLQueryAutocompleteResponse,
    SQLQueryFix,
    SQLQueryGenerator,
    SQLQueryResponse,
    TableAlert,
)
from .utils import DimUpdator, WarehouseManager, WarehouseQueryBuilder

router = APIRouter(prefix="/sql", tags=["sql"])


fix_query_prompt = """
You are provided with:
1. A current **SQL query** that is returning an error.
2. The **last working SQL query** that was running successfully.
3. The **error message** encountered.
4. The **data warehouse dialect** being used (e.g., Redshift, Snowflake).

Your task is to:
- Analyze the current SQL query and identify the issue based on the provided error message.
- Use the last working SQL query as a reference to fix the current query, ensuring compatibility with the given data warehouse dialect.
- Provide an **updated version of the SQL query** that resolves the error.

### Input:
- Current SQL Query: `<insert current SQL query>`
- Last Working SQL Query: `<insert last working SQL query>`
- Error Message: `<insert error message>`
- Data Warehouse Dialect: `<insert dialect>`

### Output:
- Return the **fixed SQL query**, ensuring it is fully functional for the provided data warehouse dialect.
"""

generate_query_prompt = """
You are a SQL expert tasked with generating SQL queries based on user requests and a given data warehouse schema. Given the following:

1. **Warehouse Schema:** A description of the tables and their columns.
2. **User Prompt:** The request that describes what the user wants to retrieve from the database.
3. **Data Warehouse Dialect:** The SQL dialect (e.g., Redshift, Snowflake, BigQuery) to be used.
4. **Current Query (optional):** The current query that the user is working on.

Please output a valid SQL query that fulfills the user request based on the schema, formatted for the specified data warehouse dialect.

### Constraints:
- Make sure the query adheres to the specific SQL syntax of the provided data warehouse dialect.
- Ensure the query uses efficient joins and aggregations based on the provided schema.
- If the user's request is unclear, make reasonable assumptions and note them in comments within the query.
"""


@router.get(
    "",
    response_model=GetSchemaOutput,
    name="Get the full warehouse schema",
    description="This returns the data for a warehouse and if something is a dim. This maintains permissions, so if are not admin, then you will only see dims that you have access to",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    query_builder = WarehouseQueryBuilder(**params.dict(), user=current_user)

    # query the data
    res = query_builder.get_results(ignore_fields=[] if params.include_columns else ["columns"])
    return res


@router.get(
    "/schemas",
    response_model=SchemaList,
    name="Get the full schema",
    description="Get al lthe warehouse schemas",
)
async def get_all_scheams(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    query_builder = WarehouseQueryBuilder(per_page=10000, user=current_user)
    res = query_builder.get_results(ignore_fields=["columns"])
    schemas = list(set([s["schema_name"] for s in res["data"]]))
    schemas.sort()
    # query the data
    return SchemaList(schema_names=schemas)


@router.get(
    "/table/{id}",
    response_model=TableSchema,
    name="Get the columns for a table",
    description="Get the columns for a table",
)
async def get_table(
    id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return WarehouseManager(user=current_user).get_table(id)


@router.post(
    "/table/{id}/to_dim",
    response_model=TableSchema,
    name="Converts a table to a dim",
    description="A dimension allows you to manage permissions and access to that table.  It will also be continually indexes for values, and if you the dim has a primary_key/join_key we will ensure the key is unique",
)
async def convert_to_dim(
    id: str,
    input: ConvertToDimInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return WarehouseManager(user=current_user).convert_to_dim(id, input.join_key)


@router.post(
    "/table/{id}/reindex",
    response_model=TableSchema,
    name="Reindexes a table",
    description="Computes all the values for the table to help with autocomplete",
)
async def reindex_table(
    id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return WarehouseManager(user=current_user).process_table(id)


@router.post(
    "/resync_schema",
    response_model=None,
    name="Resync warehouse schema",
    description="Resynchronize the warehouse schema to update tables and columns",
)
async def resync_schema(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    warehouse_manager = WarehouseManager(user=current_user)
    warehouse_manager.sync_schema()
    warehouse_manager.track("resynced_schema")
    return {"message": "Schema resynchronization completed successfully"}


@router.post(
    "/fix",
    response_model=SQLQueryResponse,
    name="Fix the query",
    description="Fix the query",
)
async def fix_query(
    query: SQLQueryFix,
    company: Company = Depends(get_current_company),
):
    warehouse_manager = WarehouseManager(company=company)
    warehouse_manager.track("ai_fixed_query")
    return ask_gpt(
        fix_query_prompt,
        "\n".join(
            [
                f"Current SQL Query: ```{query.last_query}```",
                f"Last Working query: ```{query.last_query}``",
                f"The error was: `{query.error}`",
                f"Data Warehouse Dialect: `{company.warehouse_language}`",
            ]
        ),
        SQLQueryResponse,
    )


@router.post(
    "/generate",
    response_model=SQLQueryResponse,
    name="Generate a query",
    description="Generate a query",
)
async def generate_query(
    query: SQLQueryGenerator,
    company: Company = Depends(get_current_company),
):
    builder = WarehouseQueryBuilder(company=company, search=query.prompt)
    tables = builder.get_results()["data"]
    builder.track("generated_query")
    content = []
    for t in tables:
        cols = ", ".join(
            [
                f"{c['name']}: {c['type']}" + (f"(ex. {', '.join(c['examples'])})" if c["examples"] else "")
                for c in t["columns"]
            ]
        )
        content.append(f"- {t['schema_name']}.{t['table_name']} with columns: {cols}")
    return ask_gpt(
        generate_query_prompt,
        "\n".join(
            [
                "Warehouse Schema:",
                "\n".join(content),
                f"User Prompt: '{query.prompt}'",
                f"Current Query: '{query.query}'" if query.query else "",
                f"Data Warehouse Dialect: {company.warehouse_language}",
            ]
        ),
        SQLQueryResponse,
        use_small_model=False,
    )


@router.post(
    "/components",
    response_model=SQLComponentsResponse,
    name="Gets the tables and details to autocomplete a query",
    description="Gets the tables and details to autocomplete a query",
)
async def get_components(
    query: SQLQuery,
    company: Company = Depends(get_current_company),
):
    # remove anything but . and spaces and new lines from the sql query
    sql = re.sub(r"[^a-zA-Z0-9_.\n ]", " ", query.query)

    # get the schema pieces
    schema = WarehouseManager(company=company).get_schema()
    # get the tables that are in the query
    tables = []
    for t in schema.tables:
        if t.name in sql:
            tables.append(t)

    return dict(
        warehouse_language=company.warehouse_language,
        tables=tables,
    )


@router.post(
    "/autocomplete",
    response_model=SQLQueryAutocompleteResponse,
    name="Autocomplete a query",
    description="Generate a query",
)
async def autocomplete_query(query: SQLQueryAutocomplete):
    # TODO: IF the line of the query has a FROM then give it all the tables that match the beginning of the string or all the tables in the warehouse
    return sql_autocomplete(query.before_cursor, query.after_cursor, query.warehouse_language, query.tables)


def sql_autocomplete(
    before_cursor, after_cursor, warehouse_language, tables: list[TableSchema]
) -> SQLQueryAutocompleteResponse:
    prompt = "\n".join(
        [
            "# SCHEMA",
            "\n".join([f" - {table.content}" for table in tables]),
            f"SQL DILECT: {warehouse_language}",
            "INPUT:",
            " - Before cursor: The text before the cursor",
            " - After cursor: The text after the cursor",
            "OUTPUT:",
            " - Completion: The text to add between the before and after cursor to complete the query",
        ]
    )
    # Call GPT-4o-mini model
    return ask_gpt(
        prompt=prompt,
        user_message="\n".join(
            [
                f"Before cursor: ```{before_cursor}```",
                f"After cursor: ```{after_cursor}```",
            ]
        ),
        json_schema=SQLQueryAutocompleteResponse,
        use_small_model=False,
    )


@router.patch(
    "/{id}/share",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a table with the teams you now want to share with",
    description="Update a table with the teams you now want to share with",
)
async def update_teams_to_share_with(
    id: str,
    input: ShareInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    DimUpdator(current_user).update_permissions(id, input.permissions, share_with_everyone=input.share_with_everyone)
    return None


@router.post(
    "/run",
    response_model=SQLQueryResponse,
    name="Run a SQL query",
    description="Execute a SQL query with optional admin privileges",
)
async def run_query(
    input: QueryInput,
    as_admin: bool = False,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    if as_admin and not mavis.user.is_admin:
        raise ForbiddenError("You are not authorized to run this query as admin")

    if as_admin:
        return dict(
            query=input.query,
            result=mavis.run_query(input.query),
        )

    qm = mavis.qm
    query = qm.Query()
    query.add_column(qm.Column(all_columns=True))
    query.set_from(qm.Table(sql=input.query))
    query.set_limit(1000)

    # track the query
    warehouse_manager = WarehouseManager(mavis=mavis)
    warehouse_manager.track("ran_query", data=dict(as_admin=as_admin, run_live=run_live))

    return dict(
        query=query.to_query(),
        result=mavis.run_query(query.to_query(), within_minutes=None if not run_live else 0),
    )


@router.get(
    "/subscriptions",
    response_model=EndpointAlert,
    name="Get the subscriptions for a user",
    description="Get the subscriptions for a user",
)
async def get_subscriptions(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    res = WarehouseManager(user=current_user).get_user_subscriptions()
    if res is None:
        res = EndpointAlert()
    return res


@router.patch(
    "/subscriptions",
    response_model=EndpointAlert,
    name="Update the subscriptions for a user",
    description="Update the subscriptions for a user",
)
async def update_subscriptions(
    input: EndpointAlert,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    alert = TableAlert(**input.dict(), user_id=current_user.id)
    WarehouseManager(user=current_user).update_subscription(alert)
    return alert
