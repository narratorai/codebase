import time
from datetime import UTC, datetime
from urllib.parse import parse_qs

import requests
from dateutil import parser

from core.v4.query_runner import TYPE_DATETIME, TYPE_STRING, BaseQueryRunner
from core.v4.utils import json_dumps


def get_instant_rows(metrics_data):
    rows = []

    for metric in metrics_data:
        row_data = metric["metric"]

        timestamp, value = metric["value"]
        date_time = datetime.fromtimestamp(timestamp, tz=UTC)

        row_data.update({"timestamp": date_time, "value": value})
        rows.append(row_data)
    return rows


def get_range_rows(metrics_data):
    rows = []

    for metric in metrics_data:
        ts_values = metric["values"]
        metric_labels = metric["metric"]

        for values in ts_values:
            row_data = metric_labels.copy()

            timestamp, value = values
            date_time = datetime.fromtimestamp(timestamp, tz=UTC)

            row_data.update({"timestamp": date_time, "value": value})
            rows.append(row_data)
    return rows


# Convert datetime string to timestamp
def convert_query_range(payload):
    query_range = {}

    for key in ["start", "end"]:
        if key not in payload.keys():
            continue
        value = payload[key][0]

        if type(value) is str:  # noqa: E721
            # Don't convert timestamp string
            try:
                int(value)
                continue
            except ValueError:
                pass
            value = parser.parse(value)

        if type(value) is datetime:
            query_range[key] = [int(time.mktime(value.timetuple()))]

    payload.update(query_range)


class Prometheus(BaseQueryRunner):
    should_annotate_query = False

    @classmethod
    def configuration_schema(cls):
        return {
            "type": "object",
            "properties": {"url": {"type": "string", "title": "Prometheus API URL"}},
            "required": ["url"],
        }

    def test_connection(self):
        resp = requests.get(self.configuration.get("url", None))  # noqa: ASYNC100
        return resp.ok

    def get_schema(self, get_stats=False):
        base_url = self.configuration["url"]
        metrics_path = "/api/v1/label/__name__/values"
        response = requests.get(base_url + metrics_path)  # noqa: ASYNC100
        response.raise_for_status()
        data = response.json()["data"]

        schema = {}
        for name in data:
            schema[name] = {"name": name, "columns": []}
        return list(schema.values())

    def run_query(self, query, user):
        """
        Query Syntax, actually it is the URL query string.
        Check the Prometheus HTTP API for the details of the supported query string.

        https://prometheus.io/docs/prometheus/latest/querying/api/

        example: instant query
            query=http_requests_total

        example: range query
            query=http_requests_total&start=2018-01-20T00:00:00.000Z&end=2018-01-25T00:00:00.000Z&step=60s

        example: until now range query
            query=http_requests_total&start=2018-01-20T00:00:00.000Z&step=60s
            query=http_requests_total&start=2018-01-20T00:00:00.000Z&end=now&step=60s
        """

        base_url = self.configuration["url"]
        columns = [
            {"friendly_name": "timestamp", "type": TYPE_DATETIME, "name": "timestamp"},
            {"friendly_name": "value", "type": TYPE_STRING, "name": "value"},
        ]

        try:
            error = None
            query = query.strip()
            # for backward compatibility
            query = f"query={query}" if not query.startswith("query=") else query

            payload = parse_qs(query)
            query_type = "query_range" if "step" in payload.keys() else "query"

            # for the range of until now
            if query_type == "query_range" and ("end" not in payload.keys() or "now" in payload["end"]):
                date_now = datetime.now()
                payload.update({"end": [date_now]})

            convert_query_range(payload)

            api_endpoint = base_url + f"/api/v1/{query_type}"

            response = requests.get(api_endpoint, params=payload)  # noqa: ASYNC100
            response.raise_for_status()

            metrics = response.json()["data"]["result"]

            if len(metrics) == 0:
                return None, "query result is empty."

            metric_labels = metrics[0]["metric"].keys()

            for label_name in metric_labels:
                columns.append(
                    {
                        "friendly_name": label_name,
                        "type": TYPE_STRING,
                        "name": label_name,
                    }
                )

            if query_type == "query_range":
                rows = get_range_rows(metrics)
            else:
                rows = get_instant_rows(metrics)

            json_data = json_dumps({"rows": rows, "columns": columns})

        except requests.RequestException as e:
            return None, str(e)

        return json_data, error


# registerPrometheus)
