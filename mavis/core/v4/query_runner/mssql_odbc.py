import contextlib
import logging

import pyodbc

from core.v4.query_runner import BaseSQLQueryRunner
from core.v4.query_runner.mssql import types_map

logger = logging.getLogger(__name__)


class SQLServerODBC(BaseSQLQueryRunner):
    should_annotate_query = False
    noop_query = "SELECT 1"

    @classmethod
    def configuration_schema(cls):
        return dict(
            schema={
                "type": "object",
                "properties": {
                    "server": {"type": "string", "title": "Server"},
                    "port": {"type": "number", "default": 1433, "title": "Port"},
                    "user": {"type": "string", "title": "User"},
                    "password": {"type": "string", "title": "Password"},
                    "db": {"type": "string", "title": "Database Name"},
                    "charset": {"type": "string", "default": "UTF-8", "title": "Character Set"},
                    "use_ssl": {"type": "boolean", "title": "Use SSL", "default": True},
                    "verify_ssl": {"type": "boolean", "title": "Verify SSL certificate", "default": True},
                },
                "order": ["server", "port", "user", "password", "db", "charset", "use_ssl", "verify_ssl"],
                "required": ["server", "user", "password", "db"],
                "secret": ["password"],
                "extra_options": ["verify_ssl", "use_ssl"],
            },
            uischema={
                "password": {"ui:widget": "password"},
                "aws_secret_key": {"ui:widget": "password"},
                # azure: don't allow user to uncheck ssl
                "use_ssl": {"ui:widget": "hidden"},
                # place ssh tunnel last
                "ui:order": ["*", "use_ssh_tunnel", "ssh_tunnel"],
            },
        )

    @classmethod
    def enabled(cls):
        return True

    @classmethod
    def name(cls):
        return "Microsoft SQL Server (ODBC)"

    @classmethod
    def type(cls):
        return "mssql_odbc"

    # Override the base class's host property to alias 'server'.
    # Host is used when ssh tunneling (it's set to the tunnel)
    @property
    def host(self):
        return self.configuration.get("server")

    @host.setter
    def host(self, host):
        self.configuration["server"] = host

    def get_schema(self):
        query = """
            SELECT name
            FROM sys.databases
        """  # noqa: S608

        schema = {}
        schema_data, _ = self.run_query(query)
        if schema_data is None:
            return []

        for db_row in schema_data["rows"]:
            query = f"""
                    SELECT
                        c.table_schema, c.table_name, c.column_name, c.data_type
                    FROM {db_row['name']}.INFORMATION_SCHEMA.COLUMNS c
                """  # noqa: S608
            data, _ = self.run_query(query)
            if data is None:
                continue

            for cr in data["rows"]:
                table = f"{db_row['name']}.{cr['table_schema']}.{cr['table_name']}"

                if table not in schema:
                    schema[table] = dict(name=table, columns=[], column_type=[])

                schema[table]["columns"].append(cr["column_name"])
                schema[table]["column_type"].append(cr["data_type"])

        return list(schema.values())

    def _get_connection(self):
        server = self.configuration.get("server")
        user = self.configuration.get("user", "")
        password = self.configuration.get("password", "")
        db = self.configuration["db"]
        port = self.configuration.get("port", 1433)
        self.configuration.get("charset", "UTF-8")

        connection_string_fmt = "DRIVER={{ODBC Driver 18 for SQL Server}};PORT={};SERVER={};DATABASE={};UID={};PWD={}"
        connection_string = connection_string_fmt.format(port, server, db, user, password)

        if self.configuration.get("use_ssl", False):
            connection_string += ";Encrypt=YES"

            if not self.configuration.get("verify_ssl"):
                connection_string += ";TrustServerCertificate=YES"

        # NARRATOR INTERNAL: Enable autocommit
        return pyodbc.connect(connection_string, autocommit=True)

    def _dispose_connection(self, connection):
        with contextlib.suppress(Exception):
            connection.close()

    def run_query(self, query, input_connection=None):
        connection = input_connection or self._get_connection()
        self.connection = connection

        try:
            cursor = connection.cursor()
            logger.debug("SQLServerODBC running query: %s", query)
            cursor.execute(query)

            # NARRATOR INTERNAL: Handle non-select statements
            data = None
            try:
                data = cursor.fetchall()
            except pyodbc.ProgrammingError as e:
                if "Previous SQL was not a query" in str(e):
                    # Non select statements will cause cursor fetchall to throw, but we want to proceed
                    pass
                else:
                    raise

            if cursor.description is not None:
                columns = self.fetch_columns([(i[0], types_map.get(i[1], None)) for i in cursor.description])
                rows = [dict(zip((column["name"] for column in columns), self._fix_row(row))) for row in data]

                # handle missing types
                for c in columns:
                    if c["type"] is None:
                        c["type"] = self._guess_type([r[c["name"]] for r in rows])

                data = {"columns": columns, "rows": rows}

                error = None
            else:
                error = "No data was returned."
                data = None

            cursor.close()
        except pyodbc.Error as e:
            # Query errors are at `args[1]`
            error = e.args[1] if len(e.args) > 1 else str(e.args)
            data = None
        except Exception:
            cursor.cancel()
            raise
        finally:
            if input_connection is None:
                self._dispose_connection(connection)

        return data, error

    def cancel_query(self, query, input_connection=None):
        running_query = """
        SELECT session_id, text as query
        FROM(
            SELECT req.session_id, req.status, sqltext.text
            FROM sys.dm_exec_requests req
            CROSS APPLY sys.dm_exec_sql_text (req.sql_handle) AS sqltext
        ) as r
        where status = 'running'
        """
        # get running query
        data, _ = self.run_query(running_query, input_connection)
        desired_query = self._hash_query(query)

        # cancel the query
        for r in data["rows"]:
            if self._hash_query(r["query"]) == desired_query:
                # kill the query
                with contextlib.suppress(Exception):
                    query = f'KILL {r["session_id"]}'
                    self.run_query(query, input_connection)
                return True

        return False
