import re
from copy import deepcopy
from dataclasses import dataclass
from datetime import date, timedelta

import boto3

from core import utils
from core.errors import SilenceError
from core.models.company import CompanyTable
from core.util.opentelemetry import tracer
from core.v4.query_mapping.components import (
    Column,
    Condition,
    Filter,
    Join,
    Order,
    Query,
    Table,
    clean_column_name,
    column_format,
    fix_reserved_column,
)
from core.v4.query_mapping.config import CONFIG, get_output_type


@dataclass
class QueryMapper:
    language: str | None = None
    copy_role: str | None = None
    use_boundary: bool | None = None
    start_data_on: str | None = None
    week_day_offset: int = 0
    timezone: str | None = None
    warehouse_schema: str | None = None
    config: dict | None = None

    def __post_init__(self):
        self.language = self.language or "redshift"
        self.config = deepcopy(CONFIG[self.language])

    # HACKY HACK
    # Proxy for sub-classes, injecting language
    def Query(self, *args, **kwargs) -> Query:
        kwargs["language"] = self.language
        return Query(*args, **kwargs)

    def Table(self, *args, **kwargs) -> Table:
        kwargs["language"] = self.language
        return Table(*args, **kwargs)

    def Column(self, *args, **kwargs) -> Column:
        kwargs["language"] = self.language
        kwargs["use_boundary"] = self.use_boundary
        kwargs["week_day_offset"] = self.week_day_offset
        if kwargs.get("add_timezone"):
            if kwargs.get("column_type") == "timestamp" or kwargs.get("casting") == "timestamp":
                kwargs["timezone"] = self.timezone
            kwargs.pop("add_timezone")
        return Column(*args, **kwargs)

    def Condition(self, *args, **kwargs) -> Condition:
        kwargs["language"] = self.language
        return Condition(*args, **kwargs)

    def Filter(self, *args, **kwargs) -> Filter:
        kwargs["language"] = self.language
        return Filter(*args, **kwargs)

    def Order(self, *args, **kwargs) -> Order:
        kwargs["language"] = self.language
        return Order(*args, **kwargs)

    def Join(self, *args, **kwargs) -> Join:
        kwargs["language"] = self.language
        return Join(*args, **kwargs)

    def combine_queries(self, query_list):
        # if self.language == "redshift":
        #     return " ; \n".join(query_list)
        return query_list

    def clean_query(self, query: str, context_string: str = ""):
        # python cannot handle comments so lets remove them
        # also add the Narrator context
        query = re.compile(r"/\*.*?\*/").sub("", query)

        parts = query.split("\n")
        new_parts = []
        for p in parts:
            idx = p.find("--")
            if idx != -1 and (p[:idx].count('"') % 2 + p[:idx].count("'") % 2) == 0:
                p = p[:idx]
            new_parts.append(p)

        query = context_string + "\n".join(new_parts)

        return query

    def date_trunc(self, desired_date, datepart):
        return utils.date_trunc(
            desired_date,
            datepart,
            warehouse=self.language,
            offset=self.week_day_offset,
        )

    def get_default_fields(self, is_count=False, from_sync_time=None):
        if is_count:
            fields = dict(
                from_sync_time=from_sync_time or self.start_data_on or "1900-01-01",
                to_sync_time=str(date.today() + timedelta(days=1)),
                min_date=from_sync_time or self.start_data_on or "1900-01-01",
                max_date=str(date.today() + timedelta(days=1)),
                count_comment="--",
                count_ignore=" and 1<>1 ",
            )
        else:
            fields = dict(
                from_sync_time=from_sync_time or self.start_data_on or "1900-01-01",
                to_sync_time=str(date.today() + timedelta(days=1)),
                min_date=from_sync_time or self.start_data_on or "1900-01-01",
                max_date=str(date.today() + timedelta(days=1)),
                count_comment="",
                count_ignore="",
            )

        if self.language == "mssql_odbc":
            for k in ("from_sync_time", "to_sync_time"):
                if len(fields[k]) == 10:
                    fields[k] += "T00:00:00"

        return fields

    @staticmethod
    def get_output_type(*args):
        return get_output_type(*args)

    def get_reserved_words(self):
        reserved_words = self.config["reserved_words"]
        if len(reserved_words) == 0:
            reserved_words = self.config["reserved_words"]
        return reserved_words

    @staticmethod
    def clean_column_name(name):
        return clean_column_name(name)

    def wrap_query(self, query, alias=None):
        temp_query = self.Query()
        temp_query.add_column(self.Column(all_columns=True, table_alias=alias))
        if isinstance(query, Table):
            temp_query.set_from(query)
        elif isinstance(query, str):
            temp_query.set_from(self.Table(sql=query, alias=alias))
        else:
            temp_query.ctes = query.ctes
            temp_query.set_from(self.Table(query=query, alias=alias))
        return temp_query

    @tracer.start_as_current_span("get_create_temporary_table")
    def get_create_temporary_table(self, query, temp_table_name):
        """
        Gets the temporary table if the system supports temporary table
        """
        create_query = "CREATE TEMPORARY TABLE {table} AS (\n SELECT * FROM ({query}) \n)".format(  # noqa: S608
            table=self.Table(temp_table=temp_table_name).to_query(),
            query=query.to_query(),
        )
        return create_query

    @staticmethod
    def get_union_query(query_list):
        if not query_list:
            return None

        last_query = None
        for q in query_list[::-1]:
            if last_query:
                q.set_union(last_query)
            last_query = q
        return q

    def get_activity_query(self, table: CompanyTable | str, activity_slug: str, alias="s"):
        activity = activity_slug if table.manually_partition_activity else None
        prod_query = self.wrap_query(self.stream_table(table.activity_stream, activity=activity, alias=alias))

        if not activity:
            prod_query.set_where(
                self.Condition(
                    operator="equal",
                    left=self.Column(table_column="activity", table_alias=alias),
                    right=self.Column(value=activity_slug),
                )
            )

        return prod_query

    def stream_table(
        self,
        table: CompanyTable | str,
        is_staging: bool = False,
        is_identity: bool = False,
        alias: str = None,
        activity: str = None,
    ) -> Table:
        name = table.activity_stream if isinstance(table, CompanyTable) else table
        if is_staging:
            name = f"stg__{name}"
        elif is_identity:
            name = f"identity__{name}"

        elif activity and activity.endswith("*"):
            name += f"_{utils.slugify(activity[:-1]).strip()}*"
        elif activity:
            name += f"_{utils.slugify(activity).strip()}"

        if isinstance(table, CompanyTable) and table.schema_name:
            schema_name = table.schema_name
        else:
            schema_name = self.warehouse_schema

        return self.Table(schema=schema_name, table=name, alias=alias)

    def get_activity_table(
        self,
        table: CompanyTable | str,
        slugs: list[str] | None,
        alias: str = None,
        filters=None,
        combine_at: int = 5,
    ):
        if slugs is None:
            return self.stream_table(table, alias=alias)

        # handle a single table or multiple
        if len(slugs) == 1:
            all_tables = [self.stream_table(table, activity=slugs[0], alias=alias)]
        else:
            all_tables = [self.stream_table(table, activity=s, alias=alias) for s in slugs]

            if self.language == "bigquery" and len(all_tables) > combine_at:
                # make it easier to use the table
                if isinstance(table, CompanyTable):
                    name = table.activity_stream
                else:
                    name = table

                all_tables = [self.stream_table(f"{name}_*", alias=alias)]

        last_query = None
        for tbl in all_tables:
            query = self.Query()
            query.add_column(self.Column(all_columns=True))
            query.set_from(tbl)
            if filters is not None:
                query.set_where(filters)

            if last_query:
                query.set_union(last_query)

            last_query = query

        return self.Table(query=query, alias=alias)

    @tracer.start_as_current_span("get_count_query")
    def get_count_query(self, query, by_column=None, extra_functions=None, filter=None, limit=1000):
        """
        GET_COUNT_QUERY: returns a query with the total rows of the query
        """

        count_query = self.Query()

        # add a count by column
        if by_column is None:
            by_column = []
        elif not isinstance(by_column, list):
            by_column = [by_column]

        for ii, bc in enumerate(by_column):
            count_query.add_column(self.Column(table_column=bc))
            count_query.add_group_by(ii + 1)

        count_query.add_column(self.Column(function="count_all", fields={}, name_alias="total_rows"))
        # add order by the second column
        count_query.add_order_by(len(count_query.columns), False)

        if filter:
            count_query.set_where(filter)

        # add additional cols
        for f in extra_functions or []:
            (func, col_name) = f.split(".")
            count_query.add_column(
                self.Column(
                    function=func,
                    fields={"column": self.Column(table_column=col_name)},
                    name_alias=utils.slugify(f),
                )
            )

        if isinstance(query, Table):
            count_query.set_from(query)
        elif isinstance(query, str):
            count_query.set_from(self.Table(sql=query))
        else:
            count_query.set_from(self.Table(query=query))

        # add the limit
        count_query.set_limit(limit)

        return count_query

    @tracer.start_as_current_span("get_insert_query")
    def get_insert_query(self, insert_table, query):
        if not isinstance(query, Query):
            raise TypeError("Invalid type for Query")

        cols = [column_format(self.language, c.get_name()) for c in query.get_all_columns()]
        insert_query = " INSERT INTO {table} \n {columns}\n ({query})".format(
            table=insert_table.to_query(),
            columns=f" ({', '.join(cols)})" if cols else "",
            query=query.to_query(),
        )

        # TODO: DEPRECATE
        if self.language == "mysql":
            insert_query = "Set autocommit=1; \n" + insert_query
        return insert_query

    @tracer.start_as_current_span("get_update_query")
    def get_update_query(
        self,
        update_table,
        set_conditions,
        where_filter=None,
        from_table=None,
        update_wlm_count=None,
    ):
        query = []

        # deep copy cause we manipulate the condition
        set_conditions = deepcopy(set_conditions)
        where_filter = deepcopy(where_filter)

        # TODO: DEPRECATE
        if self.language == "mysql":
            query.append("Set autocommit=1; \n")

        if self.language in ("mysql",) and from_table:
            # Create a temporary table
            if from_table.kind == "query":
                query.append("SET join_buffer_size = 64 * 1024 * 1024;\n")
                query.append(f"Create temporary table update_table as {from_table.to_query(0, only_table=True)};")
                table_name = "update_table"
            else:
                table_name = from_table.to_query()

            query.append(f"UPDATE {update_table.to_query()}")

            # add the where statement
            query.append(f"JOIN {table_name} as s")
            query.append(f"ON {where_filter.to_query(1)}")

            # add the set conditions
            query.append("SET")
            query.append(", \n".join([utils.indent(c.to_query(is_set=True), 1) for c in set_conditions]))

        elif self.language in ("databricks",) and from_table:
            query.append(f"MERGE INTO {update_table.to_query()}")

            # add the where statement
            query.append(f"USING {from_table.to_query(0)}")
            query.append(f"ON {where_filter.to_query(1)}")

            # add the set conditions
            query.append("WHEN MATCHED THEN UPDATE SET")
            query.append(", \n".join([utils.indent(c.to_query(is_set=True), 1) for c in set_conditions]))

        else:
            # deal with the aliases
            temp_alias = update_table.alias

            # remove aliais
            update_table.alias = None
            for c in set_conditions:
                self.swap_alias(c, temp_alias, None)

            # add alias that makes sense for table
            if where_filter:
                if isinstance(where_filter, Filter):
                    for f in where_filter.filters:
                        self.swap_alias(f, temp_alias, update_table.table)
                else:
                    self.swap_alias(where_filter, temp_alias, update_table.table)

            query.append(f"UPDATE {update_table.to_query(only_table=True)} ")

            # add the set conditions
            query.append("SET")
            query.append(", \n".join([utils.indent(c.to_query(is_set=True), 1) for c in set_conditions]))

            # add the from table
            if from_table:
                query.append(f"FROM {from_table.to_query(0)}")

            if where_filter:
                # add the where statement
                query.append("WHERE")
                query.append(where_filter.to_query(1))

            elif self.language in ("bigquery",):
                query.append("WHERE TRUE")

        # if self.language == "redshift" and update_wlm_count:
        #     # added the wlm query slots because most narrator updates are pretty large
        #     return self._get_wlm_query(update_wlm_count) + "\n".join(query)
        # else:
        return "\n".join(query)

    @tracer.start_as_current_span("_get_wlm_query")
    def _get_wlm_query(self, c):
        return f"set wlm_query_slot_count to {c}; \n"

    @tracer.start_as_current_span("get_largest_tables")
    def get_largest_tables(self, top_n=1000):
        return (
            f"""
                SELECT  schema as table_schema,
                        "table" as table_name,
                        size as used_mb
                FROM svv_table_info d
                order by size desc
                limit {top_n}
            """  # noqa: S608
            if self.language == "redshift"
            else None
        )

    def get_vacuum_impact_query(self):
        return (
            """
                SELECT
                    schema as table_schema,
                    "table" as table_name,
                    vacuum_sort_benefit
                from svv_table_info
                where vacuum_sort_benefit is not NULL
                    and vacuum_sort_benefit > 0
                order by vacuum_sort_benefit desc
                limit 1000;
            """
            if self.language == "redshift"
            else None
        )

    def get_encoding_recommendation(self):
        return (
            """
                SELECT
                    type,
                    database,
                    table_id,
                    ddl,
                    auto_eligible
                from svv_alter_table_recommendations
            """
            if self.language == "redshift"
            else None
        )

    @tracer.start_as_current_span("get_delete_query")
    def get_delete_query(self, delete_table, where_filter, using_table=None):
        """
        GET_DELETE_QUERY: creates a delete query
        """
        query = []

        # TODO: DEPRECATE
        if self.language == "mysql":
            query.append("Set autocommit=1; \n")

        query.append(
            f"DELETE FROM {delete_table.to_query(only_table=True)} "  # noqa: S608
        )

        # using the table
        if using_table:
            query.append(f"USING {using_table.to_query(0, False)}")

        # add the where statement
        query.append("WHERE")
        query.append(where_filter.to_query(1, False))

        return "\n".join([utils.indent(q, 0) for q in query])

    @tracer.start_as_current_span("get_create_table_query")
    def get_create_table_query(self, table, column_dicts=None, add_ons=None, query=None):
        """"""
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        # Check to make sure the query is valid
        if column_dicts is None and query is None:
            raise TypeError("Must have columns or query ")

        # create the query
        create_query = []

        # TODO: DEPRECATE
        if self.language == "mysql":
            create_query.append("Set autocommit=1; \n")

        if self.language == "mssql_odbc" and query:
            create_query.append(f"SELECT * INTO {table.to_query(only_table=True)}")
        else:
            create_query.append(f"CREATE TABLE {table.to_query(only_table=True)}")

        # create the table query
        if column_dicts:
            create_query.append(
                "({columns})".format(
                    columns=" ,\n".join(
                        [
                            "{name} {type} {extra}".format(
                                name=fix_reserved_column(self.language, c["name"]),
                                type=CONFIG[self.language]["cast_mapping"][c["type"]],
                                extra=c.get("extra") or "",
                            )
                            for c in column_dicts
                        ]
                    )
                )
            )

        # if there is a ';' in the table creation then you should not run it in the middle of the query
        run_addons_after = any(k for k in CONFIG[self.language]["create_table_addons"] if ";" in k)

        if add_ons and not run_addons_after:
            available_add_ons = [k for k, a in add_ons.items() if a] + ["table"]
            # handle the add owns
            for each_add_on in CONFIG[self.language]["create_table_addons"]:
                # check if the field is in there
                if all(f in available_add_ons for f in utils.get_required_fields(each_add_on)):
                    create_query.append(each_add_on.format(**add_ons, table=table.to_query(only_table=True)))

        # append the query
        if query:
            if self.language == "mssql_odbc":
                create_query.append(
                    f"FROM( SELECT * FROM ({query.to_query()}) as r) as r"  # noqa: S608
                )
            else:
                create_query.append(
                    f" AS ( SELECT * FROM ({query.to_query()}) as r )"  # noqa: S608
                )

        # pg add the add-ons at the end of the create query
        if add_ons and run_addons_after:
            available_add_ons = [k for k, a in add_ons.items() if a] + ["table"]
            # handle the add owns
            for each_add_on in CONFIG[self.language]["create_table_addons"]:
                # check if the field is in there
                if all(f in available_add_ons for f in utils.get_required_fields(each_add_on)):
                    create_query.append(each_add_on.format(**add_ons, table=table.to_query(only_table=True)))

        return "\n".join(create_query)

    @tracer.start_as_current_span("get_drop_table_query")
    def get_drop_table_query(self, table, cascade=False):
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        if self.language in ("databricks", "bigquery"):
            cascade = False

        drop_query = "DROP TABLE IF EXISTS {table} {cascade}".format(
            table=table.to_query(only_table=True), cascade="CASCADE" if cascade else ""
        )

        # TODO: DEPRECATE
        if self.language == "mysql":
            drop_query = "Set autocommit=1; \n" + drop_query
        return drop_query

    @tracer.start_as_current_span("get_drop_table_query")
    def get_drop_column_query(self, table, column):
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        # handle cascade
        cascade = self.language not in ("databricks", "bigquery")

        drop_query = "ALTER TABLE {table} DROP COLUMN {column} {cascade}".format(
            table=table.to_query(only_table=True),
            column=column,
            cascade="CASCADE" if cascade else "",
        )

        # TODO: DEPRECATE
        if self.language == "mysql":
            drop_query = "Set autocommit=1; \n" + drop_query
        return drop_query

    @tracer.start_as_current_span("get_add_column")
    def get_add_column(self, table, column_name, data_type):
        if self.language == "mssql_odbc":
            add_column_query = f"ALTER TABLE {table.to_query(only_table=True)} ADD {column_name} {self.config['cast_mapping'][data_type]}"
        else:
            add_column_query = f"ALTER TABLE {table.to_query(only_table=True)} ADD column {column_name} {self.config['cast_mapping'][data_type]}"
        return add_column_query

    @tracer.start_as_current_span("get_alter_table_query")
    def get_alter_table_query(self, table, new_name, add_ons=None):
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        new_table = self.Table(schema=table.schema, table=new_name)

        if self.language == "bigquery":
            # create the query
            query = self.Query()
            query.add_column(self.Column(all_columns=True))
            query.set_from(table=table)

            # create the query
            rename_query = [
                self.get_create_table_query(new_table, add_ons=add_ons, query=query),
                self.get_drop_table_query(table),
            ]
        elif self.language == "snowflake":
            rename_query = "ALTER TABLE IF EXISTS  {table} rename to {new_table}".format(
                table=table.to_query(only_table=True),
                new_table=new_table.to_query(only_table=True),
            )
        elif self.language == "mssql_odbc":
            rename_query = f"EXEC sp_rename '{table.to_query(only_table=True)}', '{new_name}'"

        else:
            rename_query = f"ALTER TABLE {table.to_query(only_table=True)} rename to {new_name}"
        return rename_query

    @tracer.start_as_current_span("get_drop_view_query")
    def get_drop_view_query(self, table, cascade=False):
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        if self.language == "databricks":
            cascade = False

        drop_query = "DROP VIEW IF EXISTS {table} {cascade} ".format(
            table=table.to_query(only_table=True), cascade="CASCADE" if cascade else ""
        )
        return drop_query

    @tracer.start_as_current_span("get_create_table_like_query")
    def get_create_table_like_query(self, table, new_table):
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        if self.language == "mssql_odbc":
            create_query = "SELECT * INTO {new_table} \n  FROM {table} where 1=2".format(  # noqa: S608
                table=table.to_query(only_table=True),
                new_table=new_table.to_query(only_table=True),
            )
        else:
            create_query = "CREATE TABLE {new_table} AS (SELECT * FROM {table} where 1=2)".format(  # noqa: S608
                table=table.to_query(only_table=True),
                new_table=new_table.to_query(only_table=True),
            )
        return create_query

    @tracer.start_as_current_span("get_create_view_query")
    def get_create_view_query(self, table, query, project_id=None):
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")
        if not isinstance(query, Query):
            raise TypeError("Invalid type for Query")

        if self.language == "bigquery":
            # add project id to all the tables in the queyr
            query.add_project_id(project_id)
            table.add_project_id(project_id)

            # output the create table
            create_query = f"CREATE VIEW {table.to_query()} AS (\n {query.to_query()} \n)"
        else:
            create_query = f"CREATE VIEW {table.to_query()} AS (\n {query.to_query()} \n)"

        # TODO: DEPRECATE
        if self.language == "mysql":
            create_query = "Set autocommit=1; \n" + create_query

        return create_query

    # dealing with different self.languages use for materialized views
    @tracer.start_as_current_span("get_create_materialize_view_query")
    def get_create_materialize_view_query(self, table, query):
        """"""
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")
        if not isinstance(query, Query):
            raise TypeError("Invalid type for Query")

        # create the table query
        if self.language == "mssql_odbc":
            return_query = f"SELECT * INTO {table.to_query()} \n  FROM ({query.to_query()}) AS r"  # noqa: S608
        else:
            return_query = f"CREATE TABLE {table.to_query()} \n  AS ({query.to_query()})"

        # TODO: DEPRECATE
        if self.language == "mysql":
            return_query = "Set autocommit=1; \n" + return_query

        return return_query

    @tracer.start_as_current_span("get_update_materialize_view_query")
    def get_update_materialize_view_query(self, table, query):
        """"""
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")
        if not isinstance(query, Query):
            raise TypeError("Invalid type for Query")

        # create the table query
        return [
            f"DELETE FROM {table.to_query(only_table=True)} where 1=1",  # noqa: S608
            self.get_insert_query(table, query),
        ]

    @tracer.start_as_current_span("get_clear_table_query")
    def get_clear_table_query(self, table):
        """"""
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        if self.language in ("bigquery", "databricks", "mssql_odbc"):
            return f"TRUNCATE TABLE {table.to_query(only_table=True)}"  # noqa: S608
        else:
            return f"TRUNCATE {table.to_query(only_table=True)}"  # noqa: S608

    @tracer.start_as_current_span("get_drop_materialize_view_query")
    def get_drop_materialize_view_query(self, table):
        """"""
        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        # create the table query
        if self.language in ("bigquery", "mssql_odbc", "databricks"):
            return f"""DROP TABLE IF EXISTS {table.to_query(only_table=True)}"""
        else:
            return f"""DROP TABLE IF EXISTS {table.to_query(only_table=True)} CASCADE"""

    @tracer.start_as_current_span("get_copy_query")
    def get_copy_query(self, table, s3_path):
        """"""
        sts = boto3.client("sts")

        if not isinstance(table, Table):
            raise TypeError("Invalid type for Table")

        if self.language == "redshift":
            if not self.copy_role:
                raise Exception("Cannot issue COPY query without a role to assume for temporary credentials")

            # NOTE the credentials must be valid for the entire duration of the query
            # if 1 hour is not enough we can update the MaxSessionDuration on the role (in company-infra), and then pass
            # a longer value here
            copy_session = sts.assume_role(
                RoleArn=self.copy_role,
                RoleSessionName="mavis-s3-copy",
                DurationSeconds=3600,
            )

            # create the table query
            return """
                COPY {table} from 's3://{s3_path}'
                credentials 'aws_access_key_id={aws_id};aws_secret_access_key={aws_secret};token={aws_session_token}'
                JSON 'auto ignorecase'
                TIMEFORMAT AS 'auto'
                BLANKSASNULL
                """.format(
                table=table.to_query(),
                s3_path=s3_path,
                aws_id=copy_session["Credentials"]["AccessKeyId"],
                aws_secret=copy_session["Credentials"]["SecretAccessKey"],
                aws_session_token=copy_session["Credentials"]["SessionToken"],
            )
        elif self.language == "snowflake":
            # NOTE the credentials must be valid for the entire duration of the query
            # if 1 hour is not enough we can update the MaxSessionDuration on the role (in company-infra), and then pass
            # a longer value here
            copy_session = sts.assume_role(
                RoleArn=self.copy_role,
                RoleSessionName="mavis-s3-copy",
                DurationSeconds=3600,
            )

            # create the table query
            return """
                COPY INTO {table} from 's3://{s3_path}'
                credentials=(aws_key_id='{aws_id}' aws_secret_key='{aws_secret}' aws_token='{aws_session_token}')
                file_format = (type = csv field_delimiter = '|');
                """.format(
                table=table.to_query(),
                s3_path=s3_path,
                aws_id=copy_session["Credentials"]["AccessKeyId"],
                aws_secret=copy_session["Credentials"]["SecretAccessKey"],
                aws_session_token=copy_session["Credentials"]["SessionToken"],
            )

        else:
            raise SilenceError("Warehouse not supported for COPY QUERY")

    # For cleaning up scripts
    @tracer.start_as_current_span("get_clean_up_query")
    def get_clean_up_query(self, table):
        if self.language == "redshift":
            # added the wlm query slots because most narrator updates are pretty large and then vacuum
            return "\n".join(
                [
                    f"END; VACUUM FULL {table.to_query()} to 100 percent;",
                    f"ANALYZE {table.to_query()};",
                ]
            )
        elif self.language == "pg":
            # added the wlm query slots because most narrator updates are pretty large and then vacuum
            return f"VACUUM VERBOSE ANALYZE {table.to_query()};"

        elif self.language == "databricks":
            return f"VACUUM {table.to_query()};"
        return None

    # For cleaning up scripts
    @tracer.start_as_current_span("get_check_compression_query")
    def get_check_compression_query(self, table):
        if self.language == "redshift":
            # added the wlm query slots because most narrator updates are pretty large and then vacuum
            return f"ANALYZE COMPRESSION {table.to_query(only_table=True)}"

        return None

    # For cleaning up scripts
    @tracer.start_as_current_span("get_alter_column_encoding")
    def get_alter_column_encoding(self, table, column, encoding):
        # added the wlm query slots because most narrator updates are pretty large and then vacuum
        return f"ALTER TABLE {table.to_query(only_table=True)} ALTER COLUMN {column} ENCODE {encoding}"

    # For cleaning up scripts
    @tracer.start_as_current_span("get_alter_column_encoding")
    def get_alter_column_type(self, table, column, new_type):
        # added the wlm query slots because most narrator updates are pretty large and then vacuum
        col_size = self.config["cast_mapping"][new_type]
        if self.language == "redshift":
            return f"END; ALTER TABLE {table.to_query(only_table=True)} ALTER COLUMN {column} TYPE {col_size};"
        else:
            return f"ALTER TABLE {table.to_query(only_table=True)} ALTER COLUMN {column} TYPE {col_size};"

    # For cleaning up scripts
    @tracer.start_as_current_span("get_cancel_query")
    def get_cancel_query(self, pid, terminate=False):
        if self.language == "redshift":
            # create the table query
            cancel_query = "SELECT {function}({pid})".format(
                pid=pid,
                function="pg_terminate_backend" if terminate else "pg_cancel_backend",
            )

        elif self.language == "snowflake":
            cancel_query = f"SELECT SYSTEM$CANCEL_QUERY({pid})"

        elif self.language == "mssql_odbc":
            cancel_query = f"kill {pid}"
        else:
            cancel_query = None

        return cancel_query

    @tracer.start_as_current_span("get_running_queries")
    def get_running_queries(self, max_minutes=None):
        if self.language == "redshift":
            query = f"""
                  SELECT
                    s.process AS pid,
                    date_trunc('second'::character varying::text, i.starttime) AS q_start,
                    date_diff('seconds', i.starttime, SYSDATE) AS duration_seconds,
                    i.query AS query_text
               FROM stv_sessions s
               INNER JOIN stv_recents i ON s.process = i.pid AND i.status = 'Running'::bpchar
               WHERE s.user_name = current_user {f" and duration_seconds > {max_minutes * 60}" if max_minutes else ""}
               ORDER BY s.process
              """  # noqa: S608
        elif self.language == "snowflake":
            query = f"""
                select
                    query_id as pid,
                    warehouse_name,
                    start_time,
                    datediff(second, start_time, current_timestamp) as total_elasped_time_in_seconds
                from
                    table(SNOWFLAKE.INFORMATION_SCHEMA.QUERY_HISTORY(
                        END_TIME_RANGE_START => dateadd(day, -3, current_timestamp)))
                where
                    EXECUTION_STATUS = 'RUNNING'
                    and user_name = CURRENT_USER
                    {f"and start_time < dateadd(minute, -{max_minutes}, current_timestamp())" if max_minutes else ""}
                  """  # noqa: S608

        elif self.language == "pg":
            query = f"""
                SELECT
                pid,
                now() - pg_stat_activity.query_start AS duration,
                query,
                state
                FROM pg_stat_activity
                WHERE (now() - pg_stat_activity.query_start) > interval '{max_minutes or 1} minutes'
            """  # noqa: S608

        elif self.language == "bigquery":
            query = f"""
                SELECT
                    job_id as pid,
                    creation_time,
                query
                FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_USER
                WHERE state != "DONE"
                    and  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), creation_time, second)/60.0 > {max_minutes}
            """  # noqa: S608
        elif self.language == "mssql_odbc":
            query = """
                select
                    r.session_id as pid,
                    s.login_name,
                    c.client_net_address,
                    s.host_name,
                    s.program_name,
                    st.text, s.status
                from sys.dm_exec_requests r
                inner join sys.dm_exec_sessions s
                on r.session_id = s.session_id
                left join sys.dm_exec_connections c
                on r.session_id = c.session_id
                outer apply sys.dm_exec_sql_text(r.sql_handle) st
                where client_net_address is not null and text is not null and s.status = 'running'
                and s.login_name = current_user
            """
        else:
            query = None

        return query

    def swap_alias(self, obj, old_alias, new_alias):
        # handle left and right condition
        if isinstance(obj, Condition):
            self.swap_alias(obj.left, old_alias, new_alias)
            self.swap_alias(obj.right, old_alias, new_alias)

        # loop through all the filters
        elif isinstance(obj, Filter):
            for f in obj.filters:
                self.swap_alias(f, old_alias, new_alias)

        elif isinstance(obj, Column):
            if old_alias in (obj.table_alias, "*"):
                obj.set_table_alias(new_alias, no_slug=True)

            # handle functions's nesting
            if obj.kind == "function":
                for _k, v in obj.fields.items():
                    self.swap_alias(v, old_alias, new_alias)
