import datetime
import logging

import requests

from core.v4.query_runner import (
    TYPE_DATETIME,
    TYPE_FLOAT,
    TYPE_STRING,
    BaseQueryRunner,
)
from core.v4.utils import json_dumps

logger = logging.getLogger(__name__)


def _transform_result(response):
    columns = (
        {"name": "Time::x", "type": TYPE_DATETIME},
        {"name": "value::y", "type": TYPE_FLOAT},
        {"name": "name::series", "type": TYPE_STRING},
    )

    rows = []

    for series in response.json():
        for values in series["datapoints"]:
            timestamp = datetime.datetime.fromtimestamp(int(values[1]), tz=datetime.timezone.utc)
            rows.append(
                {
                    "Time::x": timestamp,
                    "name::series": series["target"],
                    "value::y": values[0],
                }
            )

    data = {"columns": columns, "rows": rows}
    return json_dumps(data)


class Graphite(BaseQueryRunner):
    should_annotate_query = False

    @classmethod
    def configuration_schema(cls):
        return {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "username": {"type": "string"},
                "password": {"type": "string"},
                "verify": {"type": "boolean", "title": "Verify SSL certificate"},
            },
            "required": ["url"],
            "secret": ["password"],
        }

    def __init__(self, configuration):
        super().__init__(configuration)
        self.syntax = "custom"

        if "username" in self.configuration and self.configuration["username"]:
            self.auth = (self.configuration["username"], self.configuration["password"])
        else:
            self.auth = None

        self.verify = self.configuration.get("verify", True)
        self.base_url = "%s/render?format=json&" % self.configuration["url"]

    def test_connection(self):
        r = requests.get(  # noqa: ASYNC100
            f'{self.configuration["url"]}/render',
            auth=self.auth,
            verify=self.verify,
        )
        if r.status_code != 200:
            raise Exception(f"Got invalid response from Graphite (http status code: {r.status_code}).")

    def run_query(self, query, user):
        url = "{}{}".format(self.base_url, "&".join(query.split("\n")))
        error = None
        data = None

        try:
            response = requests.get(url, auth=self.auth, verify=self.verify)  # noqa: ASYNC100

            if response.status_code == 200:
                data = _transform_result(response)
            else:
                error = "Failed getting results (%d)" % response.status_code
        except Exception as ex:
            data = None
            error = str(ex)

        return data, error


# registerGraphite)
