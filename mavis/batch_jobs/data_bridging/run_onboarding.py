import json

import openai

from batch_jobs.data_management.run_transformations import run_transformations
from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.api.v1.endpoints.admin.onboarding.models import Mapping, QueryMapping
from core.constants import AHMED_USER_ID, LLM_AGENT_MODEL
from core.decorators import mutex_task, with_mavis
from core.errors import QueryRunError
from core.graph import graph_client
from core.logger import get_logger
from core.models.company import Company
from core.models.ids import get_uuid
from core.models.warehouse_schema import WarehouseSchema
from core.util.opentelemetry import tracer
from core.util.tracking import fivetran_track
from core.utils import find_parens, human_format
from core.v4.blocks.transformation_context_v2 import (
    _save_query,
    async_push_to_production,
)
from core.v4.mavis import Mavis

ACTIVITY_COUNT = 15
logger = get_logger()


@tracer.start_as_current_span("_deploy_query")
def _deploy_query(mavis: Mavis, query, trans_details, trans_name):
    data = dict(
        current_script=dict(
            name=trans_name,
            kind=trans_details.transformation_kind,
            table_name="activity_stream",
            update_type=trans_details.transformation_update_type,
            current_query_scratchpad=dict(
                notes="### Auto-generated SQL from onboarding \n\n",
                current_query=query,
            ),
        )
    )

    logger.info("Deploying the query", data=data)
    _save_query(mavis, data, None)

    # validate it and push it to production
    async_push_to_production.send(mavis.company.slug, data["current_script"]["id"], AHMED_USER_ID)


def __get_replace_key(key):
    return f"--{key}"


@tracer.start_as_current_span("_apply_filter_events")
def _apply_filter_events(mavis: Mavis, key, query):
    replace_key = __get_replace_key(key)
    _, column_name, use_where = key.split("|")
    count_query = mavis.qm.get_count_query(query, by_column=["activity"])

    # add a time filter
    time_filter = mavis.qm.Condition(
        operator="greater_than",
        left=mavis.qm.Column(table_column="ts"),
        right=mavis.qm.Column(value=utils.date_add(utils.utcnow(), "month", -6)),
    )
    count_query.add_filter(time_filter)
    count_query.set_limit(ACTIVITY_COUNT)
    data = mavis.run_query(count_query.to_query(), within_minutes=None)

    # Starting the query generation for each event
    all_queries = []
    all_events = []

    for row in data.rows:
        equal_cond = mavis.qm.Condition(
            operator="equal",
            left=mavis.qm.Column(
                table_column=column_name.split(".")[-1],
                table_alias=(column_name.split(".")[0] if len(column_name.split(".")) > 1 else None),
            ),
            right=mavis.qm.Column(value=row["activity"]),
        )

        # replace the query with the right condition
        if use_where == "with_where":
            cond_str = f"WHERE {equal_cond.to_query()}"  # noqa: S608
        else:
            cond_str = f"AND {equal_cond.to_query()}"  # noqa: S608

        # now we have all the where
        all_queries.append(query.replace(replace_key, cond_str))
        all_events.append(row["activity"])

        logger.debug(f"Generated query for {row['activity']}", query=all_queries[-1])

    return all_queries, all_events


@tracer.start_as_current_span("_apply_json_attirbutes")
def _apply_json_attirbutes(mavis: Mavis, key, all_queries):
    logger.debug("Applying JSON attributes to the query")

    replace_key = __get_replace_key(key)
    _, column_name = key.split("|")
    json_col = mavis.qm.Column(
        table_column=column_name.split(".")[-1],
        table_alias=(column_name.split(".")[0] if len(column_name.split(".")) > 1 else None),
    )

    # add the columns to each query
    for ii, q in enumerate(all_queries):
        new_q = q.replace(replace_key, f", {json_col.to_query()}")

        # run the query to get their values
        t_q = mavis.qm.wrap_query(new_q)
        t_q.set_limit(20)
        data = mavis.run_query(t_q.to_query(), within_minutes=None)

        # run the json to key their keys
        json_keys = []
        for r in data.rows:
            vals = json.loads(r[json_col.table_column])
            for k in vals:
                if k not in json_keys:
                    json_keys.append(k)

        # add the json keys to the query
        add_cols = []
        for k in json_keys:
            temp_col = mavis.qm.Column(
                json_column=json_col.table_column,
                json_keys=k,
                table_alias=json_col.table_alias,
                name_alias=f"feature_{k}",
            )
            add_cols.append(f", {temp_col.to_query()}")  # noqa: S608

        # update the JSON properties
        all_queries[ii] = q.replace(replace_key, "\n\t".join(add_cols))

        logger.debug("Applying Update to Query", query=all_queries[-1])


def _apply_table_join(mavis: Mavis, key, all_queries, all_events, schema: WarehouseSchema, schema_name):
    logger.debug("Applying Table Join to the query")

    replace_key = __get_replace_key(key)
    _, column_name = key.split("|")

    join_col_col = mavis.qm.Column(
        table_column=column_name.split(".")[-1],
        table_alias=(column_name.split(".")[0] if len(column_name.split(".")) > 1 else None),
    )

    # go through and add the join and table to the query
    for ii, q in enumerate(all_queries):
        slug_event = utils.slugify(all_events[ii])
        if table := schema.table(schema_name, slug_event):
            # setup all the columns
            all_cols = []
            for col in table.column_names:
                if col in (
                    "id",
                    join_col_col.table_column,
                ) or col.startswith("_"):
                    continue

                # add the columns
                q_col = mavis.qm.Column(
                    table_column=col,
                    table_alias=join_col_col.table_alias,
                    name_alias=f"feature_{col}",
                )
                all_cols.append(f", {q_col.to_query()}")  # noqa: S608

            if all_cols:
                new_q = q.replace("--{table_attributes}", "\n\t".join(all_cols))
                join_q = mavis.qm.Join(
                    table=mavis.qm.Table(schema=schema_name, table=slug_event, alias="e"),
                    condition=mavis.qm.Condition(
                        operator="equal",
                        left=join_col_col,
                        right=mavis.qm.Column(
                            table_column=join_col_col.table_column,
                            table_alias="e",
                        ),
                    ),
                )
                new_q = new_q.replace(replace_key, join_q.to_query())

            else:
                new_q = q.replace(replace_key, "").replace("--{table_attributes}", "")

            # update the query
            all_queries[ii] = new_q
            logger.debug("New query updated with joins", query=all_queries[-1])
        else:
            logger.info("No properties found for the event", event=slug_event)


@tracer.start_as_current_span("process_query")
def process_query(mavis: Mavis, query, schema_dict, schema_name):
    parens = find_parens(query, parens=("{", "}"))

    keys = [query[p[0] + 1 : p[1]] for p in parens]

    all_queries = [query]
    all_events = []
    for run_key in ("filter_event", "json_attributes", "table_event_slug"):
        for key in keys:
            if key.split("|")[0] != run_key:
                continue

            if run_key == "filter_event":
                (all_queries, all_events) = _apply_filter_events(mavis, key, query)

            elif run_key == "json_attributes":
                _apply_json_attirbutes(mavis, key, all_queries)

            elif run_key == "table_event_slug":
                _apply_table_join(mavis, key, all_queries, all_events, schema_dict, schema_name)

    return all_queries


@tracer.start_as_current_span("test_query")
def test_query(mavis: Mavis, query):
    q = mavis.qm.wrap_query(query)
    q.set_limit(10)

    try:
        data = mavis.run_query(q.to_query(), within_minutes=None)
        return True, data
    except QueryRunError as e:
        return False, str(e)


def _setup_schema(schema: WarehouseSchema, mapping: Mapping):
    current_schema = dict(
        columns=[
            dict(name="table_name", format="id"),
            dict(name="columns", format="id"),
        ],
        rows=[
            dict(table_name=t.table_name, columns=", ".join(t.column_names))
            for t in schema.tables_for(mapping.schema_name)
        ],
    )
    return current_schema


@tracer.start_as_current_span("_find_valid_query")
def _find_valid_query(mavis, trans_name, query_templates, schema_name):
    # get all the transformations
    valid_queries = [t for t in query_templates if t.transformation_name.split("||")[0] == trans_name]

    valid_for_warehouse = [t for t in valid_queries if t.warehouse_language == mavis.company.warehouse_language]

    valid_for_other_warehouse = [t for t in valid_queries if t.warehouse_language != mavis.company.warehouse_language][
        :1
    ]

    for v in valid_for_warehouse or valid_for_other_warehouse:
        query = v.query.replace("{schema}", schema_name).replace("{", "--{")

        # FOR DEBUGGING
        query = query.replace("s.message_id", "s.new_id")

        (valid, error) = test_query(mavis, query)
        if valid:
            return (valid, error, query)

    query = (
        (valid_for_warehouse or valid_for_other_warehouse)[0].query.replace("{schema}", schema_name).replace("{", "--{")
    )
    return (False, error, query)


@tracer.start_as_current_span("_get_new_query")
def _get_new_query(mavis, query, error, current_schema):
    history = []
    for _ in range(3):
        (new_query, history) = llm_fix_query(
            query,
            mavis.company.warehouse_language,
            error,
            current_schema,
            history,
        )

        (valid, error) = test_query(mavis, new_query)
        if valid:
            return (True, new_query)

    return (False, query)


@tracer.start_as_current_span("llm_fix_query")
def llm_fix_query(
    query: str,
    warehouse_language: str,
    error: str,
    schema: dict,
    messages: list[dict] = None,
):
    new_query = query

    if not messages:
        prompt = [
            f"Task: Your task is to return a corrected SQL query in {warehouse_language} dialect. Please retain all comments in the query.",
            "\n",
            "**Schema Overview**",
            human_format(schema, "table"),
            "\n",
            "**Input:**",
            "A JSON object containing two keys:",
            "query: The original SQL query that is experiencing issues.",
            "error: The specific error message or behavior observed when running the query.",
            "\n",
            "**Requirements:**",
            "Analyze the query and error provided in the JSON input.",
            "Identify the issues in the SQL query based on the error message and your understanding of the schema.",
            "Ensure that the corrected query aligns with the schema and the makes the least amount of changes from the original query.",
            "Retain any comments present in the original query.",
            "Provide the corrected query in the key `updated_query`.",
            "\n",
            "**Considerations:**",
            "Pay attention to common Redshift SQL pitfalls such as data type mismatches, incorrect table or column references, syntax errors, and misuse of functions.",
            "Consider performance implications if the error is related to query efficiency.",
            "Ensure the query adheres to best practices for Redshift SQL.",
        ]

        messages = [
            {
                "role": "system",
                "content": "\n".join(prompt),
            },
            {
                "role": "user",
                "content": json.dumps(dict(query=query, error=error)),
            },
        ]
    else:
        messages.append(
            dict(
                role="user",
                content=f"That still is not right, I got ERROR: \n\n ```\n{error}\n```, Please try again",
            )
        )

    logger.debug("Running llm with ", prompt=messages[0]["content"], messages=messages[1:])
    response = openai.ChatCompletion.create(
        model=LLM_AGENT_MODEL,  # Use the appropriate model version
        messages=messages,
        response_format={"type": "json_object"},
    )
    logger.debug("received reply", response=response.choices[0].message.dict())

    messages.append(response.choices[0].message.dict())

    new_query = json.loads(response.choices[0].message.content).get("updated_query")

    return new_query, messages


def update_onboarding(company: Company, oboarding: QueryMapping):
    company.s3.upload_object(["onboarding", "tasks.json"], tasks=oboarding.dict())


def get_onboarding(company: Company) -> QueryMapping:
    return QueryMapping(**company.s3.get_file(["onboarding", "tasks.json"]))


@mutex_task()
@with_mavis
def run_onboarding(mavis: Mavis, **kwargs):
    """
    Grant access to the warehouse schema
    """
    onboarding = get_onboarding(mavis.company)

    fivetran_track(mavis.user, data=dict(action="started_automatic_onboarding"))

    if not onboarding.mappings:
        return None

    # make sure we update the warehouse schema
    WarehouseManager(mavis=mavis).sync_schema(async_index=False)

    schema = WarehouseManager(mavis=mavis).get_schema()

    for ii, mapping in enumerate(onboarding.mappings):
        fivetran_track(
            mavis.user,
            data=dict(
                action="started_creating_activiites",
                data_source=mapping.data_source,
                schema_name=mapping.schema_name,
            ),
        )
        logger.info(f"Processing {mapping.data_source}")
        current_schema = _setup_schema(schema, mapping)

        # get the current sources
        query_templates = graph_client.get_query_templates_for_source(data_source=mapping.data_source).query_template

        # get all the transformation names
        all_vals = [t.transformation_name.split("||")[0] for t in query_templates]

        # get all the templates
        for trans_name in set(all_vals):
            did_find, error, query = _find_valid_query(mavis, trans_name, query_templates, mapping.schema_name)
            trans_details = next(t for t in query_templates if t.transformation_name.split("||")[0] == trans_name)
            logger.debug("Failed to run query ", error=error)

            if not did_find:
                (did_find, new_query) = _get_new_query(mavis, query, error, current_schema)

                if did_find:
                    # insert the new data
                    graph_client.insert_query_template(
                        warehouse_language=mavis.company.warehouse_language,
                        data_source=mapping.data_source,
                        transformation_name=f"{trans_name}||{get_uuid()[:4]}",
                        transformation_kind=trans_details.transformation_kind,
                        transformation_update_type=trans_details.transformation_update_type,
                        schema_names=trans_details.schema_names,
                        sql_query=new_query.replace(f"{mapping.schema_name}.", "{schema}.").replace("--{", "{"),
                        updated_by=mavis.user.id,
                    )
                    # override the query
                    query = new_query
                else:
                    logger.info("Could not find valid query for this transformation")

            # if you now have a query deploy it
            if did_find:
                query = process_query(mavis, query, schema, mapping.schema_name)
                _deploy_query(mavis, query, trans_details, trans_name)

        # save the onboarding task
        temp = onboarding.mappings[ii:]
        update_onboarding(mavis.company, QueryMapping(mappings=temp))

    # Trigger the run
    run_transformations.send(company_slug=mavis.company.slug, is_async=False)
