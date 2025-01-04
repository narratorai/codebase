from core.errors import WehbookError
from core.logger import get_logger
from core.models.ids import get_uuid
from core.models.table import TableData
from core.v4.dataset_comp.integrations.model import WebhookDetails
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()

event_name = "dataset_materialized"


class SendWebhook(Integration):
    @property
    def details(self) -> WebhookDetails:
        return self.mat.details

    def run(self):
        post_limit = self.details.rows_per_post

        is_last = False
        offset = 0

        while not is_last:
            raw_data = self.fetch_data(offset=offset)
            for i in range(0, raw_data.total_rows, post_limit):
                if row_mapper := self.details.webhook.row_mapping:
                    for row in raw_data.rows[i : i + post_limit]:
                        body = self._map_row(raw_data, row_mapper, row)
                        self._send_request(body)
                else:
                    body = {
                        "event_name": event_name,
                        "metadata": {
                            "post_uuid": get_uuid(replace=False),
                            "dataset_id": self.mat.dataset_id,
                            "tab_slug": self.mat.tab_slug,
                        },
                        "records": raw_data.rows[i : i + post_limit],
                    }
                    self._send_request(body)

            offset += raw_data.total_rows
            is_last = raw_data.context.is_all

    def _map_row(self, table: TableData, row_mapper: dict, row: dict) -> dict:
        return {
            k: (self._map_row(table, v, row) if isinstance(v, dict) else row.get(table.column(v).field, v))
            for k, v in row_mapper.items()
        }

    def _send_request(self, body: dict):
        response = self.post_data(
            body,
            self.details.webhook,
            max_retry=self.details.max_retry,
        )
        self._handle_response(response, body)

    def _handle_response(self, response, body):
        if 200 <= response.status_code < 300 and self.details.on_success:
            self.post_data(
                response.json(),
                self.details.on_success,
                max_retry=self.details.max_retry,
            )

        elif response.status_code >= 300 and self.details.on_failure:
            self.post_data(
                response.json(),
                self.details.on_failure,
                max_retry=self.details.max_retry,
            )
        elif response.status_code >= 300:
            raise WehbookError(
                response.reason,
                error_code=response.status_code,
                content=f"{response.content} - {response.text}",
            )
