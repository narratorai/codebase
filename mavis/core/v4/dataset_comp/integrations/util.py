import socket
from dataclasses import dataclass
from ipaddress import ip_address
from time import sleep
from urllib.parse import urlparse

import requests
from requests.auth import HTTPBasicAuth

from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core.errors import SilenceError
from core.logger import get_logger
from core.models.table import TableColumn, TableData
from core.util.llm import ask_gpt
from core.util.opentelemetry import tracer
from core.utils import date_diff, get_type, utcnow
from core.v4.dataset_comp.integrations.model import (
    APIKeyAuth,
    BearerTokenAuth,
    LoginTokenAuth,
    Materialization,
    UserAuth,
    WebhookPostDetails,
)
from core.v4.dataset_comp.query.model import Tab
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

logger = get_logger()


class SuccessAndRun(SilenceError):
    def __init__(self, message: str | None = None, delay: int = 0):
        super().__init__(message)
        self.delay = delay


def sanitize_url(url: str):
    url = url.encode("ascii", "ignore").decode("unicode_escape")
    parsed_url = urlparse(url)

    # Limit to https urls only
    if parsed_url.scheme != "https":
        raise SilenceError("Unable to send webhook to insecure URL", url=url)

    # This will prevent someone from setting a webhook to a private address in our VPC, common SSRF scenarios, etc.
    # This is only relevant in a situations like these, where mavis is making a request to a user-provided url.
    try:
        ip_str = socket.gethostbyname(parsed_url.hostname)  # type: ignore
        ip = ip_address(ip_str)
    except (ValueError, TypeError):
        raise SilenceError("Unable to resolve hostname", url=url)
    else:
        if not ip.is_global:
            raise SilenceError("Unable to send webhook to non-global IP address", url=url)

    return url


@dataclass
class Integration:
    mavis: Mavis
    mat: Materialization
    dataset: Dataset | None = None
    started_at: str = None

    def __post_init__(self):
        self.dataset = Dataset(self.mavis, self.mat.dataset_id, limit=None)
        self.started_at = utcnow()

    @property
    def model(self) -> Dataset | Tab:
        if self.mat.tab_slug:
            return self.dataset.model.tab(self.mat.tab_slug)
        else:
            return self.dataset.model

    @staticmethod
    def validate(mat: Materialization) -> bool:
        return None

    def timeout_checkin(self, message: str | None = None, delay: int = 0):
        if date_diff(self.started_at, utcnow(), "minutes") > 120:
            raise SuccessAndRun(message or "Too long and need to retry so user gets feedback", delay=delay)

    def custom_task(self) -> CustomTask:
        return CustomTask(self.mavis.company.s3, kind=TaskKindEnum.materialization, id=self.mat.id)

    @tracer.start_as_current_span("apply_ai_prompt")
    def apply_ai_prompt(self, data: TableData):
        if self.mat.ai_prompt:
            for ii, row in enumerate(data.rows):
                ai_row = ask_gpt(self.mat.ai_prompt, row)
                row.update(**{k: v for k, v in ai_row.items()})

                if ii == 0:
                    data.columns.extend(
                        [
                            TableColumn(
                                id=k,
                                field=k,
                                type=get_type(v),
                                header_name=k,
                                raw_type=get_type(v),
                            )
                            for k, v in ai_row.items()
                        ]
                    )
        return data

    @tracer.start_as_current_span("fetch_data")
    def fetch_data(
        self,
        offset: int = 0,
    ) -> TableData:
        # Don't fetch data with None
        if self.dataset.limit is None:
            self.dataset.limit = 1_0000
        raw_data = self.dataset.run(self.mat.tab_slug, offset=offset, run_live=True)
        # apply the AI prompt
        self.apply_ai_prompt(raw_data)
        return raw_data

    def count_rows(self) -> int:
        count_query = self.mavis.qm.get_count_query(
            self.dataset.qm_query(tab_slug=self.mat.tab_slug, remove_limit=True)
        )
        return self.mavis.run_query(count_query.to_query()).rows[0]["total_rows"]

    def post_data(self, data: dict, details: WebhookPostDetails, params: dict = None, max_retry=5):
        return post_webhook_data(data, details, params, max_retry)


@tracer.start_as_current_span("post_data")
def post_webhook_data(data: dict, details: WebhookPostDetails, params: dict = None, max_retry=5):
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json",
        "User-Agent": "narrator-webhook/1.0.0",
        **details.headers,
    }

    auth = details.auth
    auth_tuple = None
    if isinstance(auth, UserAuth):
        auth_tuple = HTTPBasicAuth(auth.user, auth.password)

    elif isinstance(auth, LoginTokenAuth):
        # First, get the token
        token_response = requests.post(auth.url, json=auth.body)
        token = token_response.json()[auth.token_key]

        # Then use the token for the main request
        headers["Authorization"] = f"Bearer {token}"

    elif isinstance(auth, BearerTokenAuth):
        headers["Authorization"] = f"Bearer {auth.token}"

    elif isinstance(auth, APIKeyAuth):
        headers["X-API-Key"] = auth.api_key

    for ii in range(max_retry + 1):
        response = requests.post(
            sanitize_url(details.url),
            json=data,
            headers=headers,
            auth=auth_tuple,
            params=params,
        )
        # deal with the status code
        if 200 <= response.status_code < 300:
            logger.debug(
                "Successfully posted data",
                url=details.url,
                status_code=response.status_code,
            )
            return response
        elif response.status_code >= 400:
            logger.debug(
                "Retrying the post",
                url=details.url,
                status_code=response.status_code,
                res_text=response.text,
            )
            if ii == max_retry:
                raise SilenceError(response.text)
            sleep(ii**2)
        else:
            return response

    def run(self):
        raise NotImplementedError
