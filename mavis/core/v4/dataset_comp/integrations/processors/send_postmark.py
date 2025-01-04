from datetime import timedelta

from postmarker.core import PostmarkClient

from core.logger import get_logger
from core.models.ids import to_id
from core.util.redis import redis_client
from core.utils import make_local, slugify, utcnow
from core.v4.dataset_comp.integrations.model import PostMarkDetails
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()


class SendPostmark(Integration):
    @property
    def details(self) -> PostMarkDetails:
        return self.mat.details

    def run(self):
        # connect to postmark
        postmark = PostmarkClient(server_token=self.details.api_key)
        # get the data for the google sheet

        is_last = False
        offset = 0
        # within_minutes = self.get_within_minutes()
        # loop and post the data
        while not is_last:
            raw_data = self.fetch_data(offset=offset)
            # loop add post the data
            for r in raw_data.rows:
                key = f"{self.mavis.company.slug}:{to_id(r)}"
                if redis_client.get(key):
                    logger.debug("Email already sent", email_id=r["email_id"])
                    continue

                local_time = make_local(utcnow(), self.mavis.company.timezone)
                # send the email
                template_model = dict(
                    local_time=local_time,
                    date=local_time[:10],
                    **r,
                )
                tag = slugify(self.mat.label).replace("_", "-")
                to_email = r[self.dataset.ds.column_mapper[self.details.column_id]]

                # send the email
                res = postmark.emails.send_with_template(
                    TemplateId=self.details.template_id,
                    TemplateModel=template_model,
                    From=self.details.from_email,
                    To=to_email,
                    TrackOpens=True,
                    TrackLinks="HtmlAndText",
                    Tag=tag,
                )

                # Track the email with the success webhook
                if self.mat.details.success_webhook is not None:
                    self.post_data(res | template_model | dict(to=to_email, tag=tag), self.mat.details.success_webhook)

                # save the email to redis
                redis_client.setex(key, timedelta(days=5), "1")

            is_last = raw_data.context.is_all
