from time import sleep

import requests

from core.errors import SilenceError
from core.logger import get_logger
from core.util.opentelemetry import tracer
from core.utils import is_email
from core.v4.dataset_comp.integrations.model import WebhookPostDetails, klaviyoDetails
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()


class SendKlaviyo(Integration):
    @property
    def details(self) -> klaviyoDetails:
        return self.mat.details

    def create_bulk_import_body(self, body, list_id):
        valid_keys = [
            "email",
            "phone_number",
            "anonymous_id",
            "first_name",
            "last_name",
            "title",
            "organization",
        ]
        profiles = []

        for e in body["profiles"]:
            attributes = dict(
                **{k: v for k, v in e.items() if k in valid_keys},
                properties={k: v for k, v in e.items() if k not in valid_keys},
            )
            profiles.append(dict(type="profile", attributes=attributes))

        new_body = dict(
            data=dict(
                type="profile-bulk-import-job",
                attributes=dict(
                    profiles=dict(data=profiles),
                ),
                relationships=dict(lists=dict(data=[dict(type="list", id=list_id)])),
            )
        )
        return new_body

    @tracer.start_as_current_span("post_klaviyo")
    def post_klaviyo(self, proper_url: str, body: dict, list_id: str):
        body = self.create_bulk_import_body(body, list_id)
        headers = {
            "accept": "application/json",
            "revision": "2024-07-15",
            "Authorization": f"Klaviyo-API-Key {self.details.api_key}",
        }
        # initialize the request
        response = self.post_data(
            body,
            WebhookPostDetails(
                url=proper_url,
                headers=headers,
            ),
            max_retry=0,
        )
        if response.status_code >= 400:
            raise SilenceError(f"Error posting to Klaviyo: {response.text}")

        job_id = response.json()["data"]["id"]
        logger.info("Job created", job_id=job_id)

        # poll to check on the data (Max 10 minutes)
        for _ in range(120):
            # check on the job
            res = requests.get(
                f"https://a.klaviyo.com/api/profile-bulk-import-jobs/{job_id}/",
                headers=headers,
            )
            logger.debug(
                "Checking on the job",
                job_id=job_id,
                response=res.json(),
            )
            if res.json()["data"]["attributes"]["status"] == "complete":
                break

            sleep(5)

    @tracer.start_as_current_span("run")
    def run(self):
        max_retry = 4

        # data body
        body = dict(profiles=[])
        is_last = False
        offset = 0
        email_column = None

        # list ursl: https://www.klaviyo.com/list/R9fKuD/never-used-discount
        # https://mc.sendgrid.com/contacts/lists/1023a0b9-0b0f-4347-ace3-e5b87de498aa
        # api url : https://a.klaviyo.com/api/v2/list/LIST_ID/members
        parts = self.details.url.split("/")

        if "www.klaviyo.com" in parts:
            list_id = parts[parts.index("list") + 1]
            proper_url = "https://a.klaviyo.com/api/profile-bulk-import-jobs/"

            post_limit = 1000
        else:
            list_id = parts[parts.index("lists") + 1]
            proper_url = "https://api.sendgrid.com/v3/marketing/contactslist"
            post_limit = 95
        bad_emails = []
        self.dataset.limit = 10_000

        # loop and post the data
        while not is_last:
            data = self.fetch_data(offset=offset)

            # find the email column
            if email_column is None and data.total_rows > 0:
                # check the customer column
                try:
                    email_column = next(k for k, v in data.rows[0].items() if is_email(str(v)))
                except Exception:
                    raise SilenceError("Cannot find a valid email column in data")

            ii = 0
            # loop add post the data
            while ii < data.total_rows:
                # send the profiles to the list
                body["profiles"] = [
                    r | dict(email=r[email_column])
                    for r in data.rows[ii : (ii + post_limit)]
                    if r[email_column] not in bad_emails and is_email(r[email_column])
                ]

                # post and retry
                if "www.klaviyo.com" in parts:
                    self.post_klaviyo(proper_url, body, list_id)

                else:
                    body["list_ids"] = [list_id]
                    self.post_data(
                        proper_url,
                        body,
                        token=self.details.api_key,
                        max_retry=max_retry,
                    )

                ii += post_limit

            offset += data.total_rows
            is_last = data.context.is_all
