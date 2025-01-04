# Narrator Internal: this file has been modified on our fork
# see get_schema

import contextlib

import snowflake.connector as sf_connector
from dramatiq_abort import Abort

from core.logger import get_logger
from core.v4.query_runner import (
    TYPE_BOOLEAN,
    TYPE_DATE,
    TYPE_DATETIME,
    TYPE_FLOAT,
    TYPE_INTEGER,
    TYPE_STRING,
    BaseQueryRunner,
)
from core.v4.utils import json_loads

TYPES_MAP = {
    0: TYPE_INTEGER,
    1: TYPE_FLOAT,
    2: TYPE_STRING,
    3: TYPE_DATE,
    4: TYPE_DATETIME,
    5: TYPE_STRING,
    6: TYPE_DATETIME,
    7: TYPE_DATETIME,
    8: TYPE_DATETIME,
    13: TYPE_BOOLEAN,
}

logger = get_logger()


class Snowflake(BaseQueryRunner):
    noop_query = "SELECT 1"

    @classmethod
    def configuration_schema(cls):
        return dict(
            schema={
                "type": "object",
                "properties": {
                    "account": {"type": "string", "title": "Account Name"},
                    "user": {"type": "string", "title": "User"},
                    "password": {"type": "string", "title": "Password"},
                    "warehouse": {"type": "string", "title": "Warehouse"},
                    "database": {"type": "string", "title": "Database"},
                    "region": {"type": "string", "title": "Region", "default": "us-west"},
                },
                "order": ["account", "user", "password", "warehouse", "database", "region"],
                "required": ["user", "password", "account", "database", "warehouse"],
                "secret": ["password"],
            },
            uischema={
                "password": {"ui:widget": "password"},
                # hardcoded for Snowflake
                "region": {"ui:widget": "hidden"},
                "account": {
                    "ui:help": "The full/entire string to the left of snowflakecomputing.com. ie. xy12345.us-east-1"
                },
                # place ssh tunnel last
                "ui:order": ["*", "use_ssh_tunnel", "ssh_tunnel"],
            },
        )

    @classmethod
    def enabled(cls):
        return True

    @classmethod
    def determine_type(cls, data_type, scale):
        t = TYPES_MAP.get(data_type, None)
        if t == TYPE_INTEGER and scale > 0:
            return TYPE_FLOAT
        return t

    def _get_connection(self):
        region = self.configuration.get("region")
        account = self.configuration["account"]

        # for us-west we don't need to pass a region (and if we do, it fails to connect)
        if region == "us-west":
            region = None

        if self.configuration.__contains__("host"):
            host = self.configuration.get("host")
        elif region:
            # NARRATOR INTERNAL: make sure we don't inject the region twice
            if len(account.split(".")) > 1:
                region = account.split(".")[-1]
                account = sf_connector.util_text.parse_account(account)

            host = f"{account}.{region}.snowflakecomputing.com"
        else:
            # NARRATOR INTERNAL: make sure we connect to the right region
            if len(account.split(".")) > 1:
                region = account.split(".")[-1]
                if region == "us-west":
                    # See note above
                    region = None

            host = f"{account}.snowflakecomputing.com"
            account = sf_connector.util_text.parse_account(account)

        connection = sf_connector.connect(
            user=self.configuration["user"],
            password=self.configuration["password"],
            account=account,
            region=region,
            host=host,
            # NARRATOR INTERNAL: set the application name for Snowflake Partner Program
            # This allows Snowflake to attribute credit to Narrator for how much compute we cause.
            # It’s a requirement for them to add us to their partner program.
            application="Narrator_Narrator",
        )

        # setup the warehouse connection
        with contextlib.suppress(Exception):
            cursor = connection.cursor()
            cursor.execute(f'USE WAREHOUSE {self.configuration["warehouse"]}')
            cursor.execute(f'USE {self.configuration["database"]}')

        return connection

    def _dispose_connection(self, connection):
        logger.debug("Dispose connection")

        try:
            connection.close()
        except Abort:
            raise
        except Exception:  # noqa: S110
            pass

    def _parse_results(self, cursor):
        columns = self.fetch_columns([(i[0], self.determine_type(i[1], i[5])) for i in cursor.description])
        rows = [dict(zip((column["name"] for column in columns), self._fix_row(row))) for row in cursor]

        return {"columns": columns, "rows": rows}

    def run_query(self, query, input_connection=None):
        connection = input_connection or self._get_connection()
        self.connection = connection
        cursor = connection.cursor()
        data = None

        try:
            cursor.execute(query, timeout=60 * 60)  # timeout 1 hr
            data = self._parse_results(cursor)
            error = None
        except Exception:
            raise
        finally:
            cursor.close()

        return data, error

    def cancel_query(self, query, input_connection=None):
        logger.info("Cancel query", query=query)

        running_query = """
        SELECT
            req.query_id, req.query_text as query
        FROM table(information_schema.query_history()) AS req
        WHERE req.execution_status = 'RUNNING'
        """
        # get running query
        data, err = self.run_query(running_query, input_connection)
        desired_query = self._hash_query(query)

        if err:
            return False

        # cancel the query
        for r in data["rows"]:
            if self._hash_query(r["query"]) == desired_query:
                # kill the query
                try:
                    query = f"""SELECT SYSTEM$CANCEL_QUERY('{r["query_id"]}')"""
                    self.run_query(query, input_connection)
                except Abort:
                    raise
                except Exception:
                    return False
                return True

        return False

    def _run_query_without_warehouse(self, query):
        connection = self._get_connection()
        cursor = connection.cursor()

        try:
            cursor.execute(query)
            data = self._parse_results(cursor)
            error = None
        finally:
            cursor.close()
            connection.close()

        return data, error

    def _get_database_schema(self, db_row):
        if db_row["database_name"] == "SNOWFLAKE_SAMPLE_DATA":
            return []

        query = f"""
        Show columns in schema {db_row['database_name']}.{db_row['name']}
        """
        try:
            data, _ = self._run_query_without_warehouse(query)
        except Exception:
            # probably a permissions issue
            return []

        schema = {}
        for cr in data["rows"]:
            table = f"{db_row['database_name']}.{cr['schema_name']}.{cr['table_name']}"

            if table not in schema:
                schema[table] = dict(name=table, columns=[], types=[])

            schema[table]["columns"].append(cr["column_name"])
            schema[table]["types"].append(json_loads(cr["data_type"]).get("type"))

        return list(schema.values())

    def _get_all_database_schemas(self):
        # returns the schema information for all available databases in the warehouse
        schemas = []
        query = "SHOW SCHEMAS in ACCOUNT"
        # get the schema
        data, error = self._run_query_without_warehouse(query)
        if error is not None:
            schemas += self._get_database_schema()
        else:
            for row in data["rows"]:
                schemas += self._get_database_schema(row)

        return schemas

    def get_schema(self, get_stats=False):
        return self._get_all_database_schemas()
