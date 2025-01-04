# Narrator Internal: this file has been modified on our fork
# see get_schema

import json
from base64 import b64decode
from collections import defaultdict
from datetime import timedelta

from dramatiq_abort import Abort
from google.cloud import bigquery
from google.oauth2 import service_account

from core.logger import get_logger
from core.util.redis import redis_client
from core.v4.query_runner import (
    TYPE_BOOLEAN,
    TYPE_DATETIME,
    TYPE_FLOAT,
    TYPE_INTEGER,
    TYPE_STRING,
    BaseQueryRunner,
)
from core.v4.utils import json_loads

logger = get_logger()

types_map = {
    "INTEGER": TYPE_INTEGER,
    "FLOAT": TYPE_FLOAT,
    "BOOLEAN": TYPE_BOOLEAN,
    "STRING": TYPE_STRING,
    "TIMESTAMP": TYPE_DATETIME,
}


def transform_row(row, fields, apply_func=None):
    row_data = {}

    for column_index, cell in enumerate(row):
        field = fields[column_index]
        if field.mode == "REPEATED":
            cell = str(cell)
        elif field.field_type == "JSON":
            cell = json.dumps(cell)

        if apply_func:
            row_data[field.name] = apply_func(cell)
        else:
            row_data[field.name] = cell
    return row_data


def _default_schema():
    return {"columns": [], "types": [], "name": ""}


class BigQuery(BaseQueryRunner):
    should_annotate_query = False
    noop_query = "SELECT 1"

    @classmethod
    def enabled(cls):
        return True

    @classmethod
    def configuration_schema(cls):
        return dict(
            schema={
                "type": "object",
                "properties": {
                    "projectId": {"type": "string", "title": "Project ID"},
                    "jsonKeyFile": {
                        "type": "string",
                        "format": "data-url",
                        "title": "JSON Key File",
                    },
                    "totalMBytesProcessedLimit": {
                        "type": "number",
                        "title": "Scanned Data Limit (MB)",
                    },
                    "userDefinedFunctionResourceUri": {
                        "type": "string",
                        "title": "UDF Source URIs (i.e. gs://bucket/date_utils.js, gs://bucket/string_utils.js )",
                        "default": "",
                    },
                    "useStandardSql": {
                        "type": "boolean",
                        "title": "Use Standard SQL",
                        "default": True,
                    },
                    "location": {
                        "type": "string",
                        "title": "Processing Location",
                        "enum": [
                            "US",
                            "EU",
                            "us-central1",
                            "us-west4",
                            "us-west2",
                            "northamerica-northeast1",
                            "us-east4",
                            "us-west1",
                            "us-west3",
                            "southamerica-east1",
                            "us-east1",
                            "northamerica-northeast2",
                            "europe-west1",
                            "europe-north1",
                            "europe-west3",
                            "europe-west2",
                            "europe-west4",
                            "europe-central2 ",
                            "europe-west6",
                            "asia-south2",
                            "asia-east2",
                            "asia-southeast2",
                            "australia-southeast2",
                            "asia-south1",
                            "asia-northeast2",
                            "asia-northeast3",
                            "asia-southeast1",
                            "australia-southeast1",
                            "asia-east1",
                            "asia-northeast1",
                        ],
                        "enumNames": [
                            "US",
                            "EU",
                            "Iowa - us-central1",
                            "Las Vegas - us-west4",
                            "Los Angeles us-west2",
                            "Montréal - northamerica-northeast1",
                            "Northern Virginia - us-east4",
                            "Oregon - us-west1",
                            "Salt Lake City - us-west3",
                            "São Paulo - southamerica-east1",
                            "South Carolina - us-east1",
                            "Toronto - northamerica-northeast2",
                            "Belgium - europe-west1",
                            "Finland - europe-north1",
                            "Frankfurt - europe-west3",
                            "London - europe-west2",
                            "Netherlands europe-west4",
                            "Warsaw - europe-central2 ",
                            "Zürich - europe-west6",
                            "Delhi - asia-south2",
                            "Hong Kong - asia-east2",
                            "Jakarta - asia-southeast2",
                            "Melbourne - australia-southeast2",
                            "Mumbai - asia-south1",
                            "Osaka - asia-northeast2",
                            "Seoul - asia-northeast3",
                            "Singapore - asia-southeast1",
                            "Sydney - australia-southeast1",
                            "Taiwan - asia-east1",
                            "Tokyo - asia-northeast1",
                        ],
                        "default": "US",
                    },
                    "loadSchema": {
                        "type": "boolean",
                        "title": "Load Schema",
                        "default": True,
                    },
                    "maximumBillingTier": {
                        "type": "number",
                        "title": "Maximum Billing Tier",
                    },
                },
                "required": ["jsonKeyFile", "projectId", "location"],
                "order": [
                    "projectId",
                    "jsonKeyFile",
                    "loadSchema",
                    "useStandardSql",
                    "location",
                    "totalMBytesProcessedLimit",
                    "maximumBillingTier",
                    "userDefinedFunctionResourceUri",
                ],
                "secret": ["jsonKeyFile"],
            },
            uischema={
                "password": {"ui:widget": "password"},
                # hardcoded for bigquery
                "useStandardSql": {"ui:widget": "hidden"},
                "loadSchema": {"ui:widget": "hidden"},
                "maximumBillingTier": {"ui:widget": "hidden"},
                "totalMBytesProcessedLimit": {"ui:widget": "hidden"},
                "userDefinedFunctionResourceUri": {"ui:widget": "hidden"},
                "location": {
                    "ui:help": "Location of your datasets. If unsure select 'US' If outside the US or EU please contact us",
                },
                "jsonKeyFile": {
                    "ui:help": "JSON Key File will not show on saved warehouse connection for security purposes.  Uploading a new file will override the saved file."
                },
                # place ssh tunnel last
                "ui:order": ["*", "use_ssh_tunnel", "ssh_tunnel"],
            },
        )

    def _get_bigquery_service(self):
        key = json_loads(b64decode(self.configuration["jsonKeyFile"]))

        scope = [
            "https://www.googleapis.com/auth/bigquery",
            "https://www.googleapis.com/auth/drive",
        ]

        # credentials from the in-memory JSON
        credentials = service_account.Credentials.from_service_account_info(key).with_scopes(scope)

        # Create a BigQuery client using the credentials
        client = bigquery.Client(credentials=credentials, project=credentials.project_id)
        return client

    def _get_project_id(self):
        return self.configuration["projectId"]

    def _get_location(self):
        return self.configuration.get("location")

    def _get_lock_key(self, query):
        return f"query:bigquery:{self._get_project_id()}:{self._hash_query(query)}"

    def _results_to_data(self, results):
        rows = []
        for row in results:
            rows.append(transform_row(row, results.schema, self._fix_type))

        columns = [
            {
                "name": f.name,
                "friendly_name": f.name,
                "type": ("string" if f.mode == "REPEATED" else types_map.get(f.field_type, "string")),
            }
            for f in results.schema
        ]

        data = {
            "columns": columns,
            "rows": rows,
            "metadata": {},
        }
        return data

    # NARRATOR INTERNAL: modified to load schemas for all projects
    def get_schema(self):
        client = self._get_bigquery_service()
        # List all projects
        projects = client.list_projects()
        schemas = defaultdict(_default_schema)
        # Iterate through all projects
        for project in projects:
            if project.project_id != self._get_project_id():
                prefix = f"{project.project_id}."
            else:
                prefix = ""
            for dataset in client.list_datasets(project.project_id):
                query = f"""
                SELECT table_schema, table_name, column_name, data_type
                FROM `{prefix}{dataset.dataset_id}.INFORMATION_SCHEMA.COLUMNS`
                """  # noqa: S608
                (data, error) = self.run_query(query, input_connection=client)

                if error:
                    raise ValueError(error)

                for row in data["rows"]:
                    table = f"{prefix}{row['table_schema']}.{row['table_name']}"

                    schemas[table]["columns"].append(row["column_name"])
                    schemas[table]["types"].append(row["data_type"])
                    schemas[table]["name"] = table

        return list(schemas.values())

    def _get_connection(self):
        return self._get_bigquery_service()

    def run_query(self, query, input_connection=None):
        if input_connection:
            client = input_connection
        else:
            client = self._get_bigquery_service()

        data = None
        error = None
        query_job = client.query(query, timeout=60 * 60 * 2)  # API request

        # save the query
        self.lock_key = self._get_lock_key(query)
        try:
            redis_client.setex(self.lock_key, timedelta(days=5), query_job.job_id)
        except Exception:  # noqa: S110
            logger.exception("Failed to save cache")

        # run the query
        try:
            results = query_job.result()

            if query_job.errors:
                error = query_job.errors
            else:
                data = self._results_to_data(results)
                # add the meta data
                data["metadata"]["data_scanned"] = query_job.total_bytes_processed

        except Exception as e:
            error = str(e)
        finally:
            # remove the lock
            if self.lock_key:
                redis_client.delete(self.lock_key)
                self.lock_key = None

        return data, error

    def _dispose_connection(self, connection):
        logger.debug("Dispose connection")

        # Bigquery doesn't have a connection but should cancel any query on dispose
        try:
            if self.lock_key:
                connection.cancel_job(
                    redis_client[self.lock_key].decode(),
                    project=self._get_project_id(),
                    location=self._get_location(),
                )
                redis_client.delete(self.lock_key)
        except Abort:
            raise
        except Exception:  # noqa: S110
            pass
        finally:
            connection.close()

    def cancel_query(self, query, input_connection: bigquery.Client = None):
        logger.info("Cancel query", query=query)

        if input_connection is None:
            input_connection = self._get_bigquery_service()

        # properly cancel the query from the jobs
        lock_key = self._get_lock_key(query)
        if redis_client.get(lock_key):
            input_connection.cancel_job(
                redis_client[lock_key].decode(),
                project=self._get_project_id(),
                location=self._get_location(),
            )
            redis_client.delete(lock_key)
            return True
        return False
