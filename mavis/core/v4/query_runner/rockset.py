import requests

from core.v4.query_runner import (
    TYPE_BOOLEAN,
    TYPE_FLOAT,
    TYPE_INTEGER,
    TYPE_STRING,
    BaseSQLQueryRunner,
)
from core.v4.utils import json_dumps


def _get_type(value):
    if isinstance(value, int):
        return TYPE_INTEGER
    elif isinstance(value, float):
        return TYPE_FLOAT
    elif isinstance(value, bool):
        return TYPE_BOOLEAN
    elif isinstance(value, str):
        return TYPE_STRING
    return TYPE_STRING


# The following is here, because Rockset's PyPi package is Python 3 only.
# Should be removed once we move to Python 3.
class RocksetAPI:
    def __init__(self, api_key, api_server):
        self.api_key = api_key
        self.api_server = api_server

    def _request(self, endpoint, method="GET", body=None):
        headers = {
            "Authorization": f"ApiKey {self.api_key}",
            "User-Agent": "rest:redash/1.0",
        }
        url = f"{self.api_server}/v1/orgs/self/{endpoint}"

        if method == "GET":
            r = requests.get(url, headers=headers)
            return r.json()
        elif method == "POST":
            r = requests.post(url, headers=headers, json=body)
            return r.json()
        else:
            raise Exception(f"Unknown method: {method}")

    def list_workspaces(self):
        response = self._request("ws")
        return [x["name"] for x in response["data"] if x["collection_count"] > 0]

    def list_collections(self, workspace="commons"):
        response = self._request(f"ws/{workspace}/collections")
        return [x["name"] for x in response["data"]]

    def collection_columns(self, workspace, collection):
        response = self.query(f'DESCRIBE "{workspace}"."{collection}" OPTION(max_field_depth=1)')
        return sorted(set([x["field"][0] for x in response["results"]]))

    def query(self, sql):
        return self._request("queries", "POST", {"sql": {"query": sql}})


class Rockset(BaseSQLQueryRunner):
    noop_query = "SELECT 1"

    @classmethod
    def configuration_schema(cls):
        return {
            "type": "object",
            "properties": {
                "api_server": {
                    "type": "string",
                    "title": "API Server",
                    "default": "https://api.rs2.usw2.rockset.com",
                },
                "api_key": {"title": "API Key", "type": "string"},
            },
            "order": ["api_key", "api_server"],
            "required": ["api_server", "api_key"],
            "secret": ["api_key"],
        }

    @classmethod
    def type(cls):
        return "rockset"

    def __init__(self, configuration):
        super().__init__(configuration)
        self.api = RocksetAPI(
            self.configuration.get("api_key"),
            self.configuration.get("api_server", "https://api.rs2.usw2.rockset.com"),
        )

    def _get_tables(self, schema):
        for workspace in self.api.list_workspaces():
            for collection in self.api.list_collections(workspace):
                table_name = collection if workspace == "commons" else f"{workspace}.{collection}"
                schema[table_name] = {
                    "name": table_name,
                    "columns": self.api.collection_columns(workspace, collection),
                }
        return sorted(schema.values(), key=lambda x: x["name"])

    def run_query(self, query, user):
        results = self.api.query(query)
        if "code" in results and results["code"] != 200:
            return None, f'{results["type"]}: {results["message"]}'

        if "results" not in results:
            message = results.get("message", "Unknown response from Rockset.")
            return None, message

        rows = results["results"]
        columns = []
        if len(rows) > 0:
            columns = [{"name": k, "friendly_name": k, "type": _get_type(rows[0][k])} for k in rows[0]]
        data = json_dumps({"columns": columns, "rows": rows})
        return data, None
