from core.constants import SQL_ALERT_EMAIL_TEMPLATE
from core.graph import graph_client
from core.logger import get_logger
from core.models.internal_link import PORTAL_URL
from core.util.email import send_email
from core.v4.dataset_comp.integrations.model import AlertDetails
from core.v4.dataset_comp.integrations.util import Integration

logger = get_logger()


class SendAlert(Integration):
    @property
    def details(self) -> AlertDetails:
        return self.mat.details

    def run(self):
        data = self.fetch_data()

        total_rows = data.total_rows

        if total_rows == self.details.return_rows:
            logger.info("Send the alert")
            template_model = dict(
                utm_medium="email",
                utm_content="alert",
                name=self.mat.label,
                total_rows=total_rows,
                kind="dataset",
            )

            dataset_slug = graph_client.get_dataset_basic(id=self.mat.dataset_id).dataset_by_pk.slug
            template_model["download_url"] = f"{PORTAL_URL}/{self.mavis.company.slug}/datasets/edit/{dataset_slug}"

            send_email(
                self.mavis.company,
                self.details.email,
                SQL_ALERT_EMAIL_TEMPLATE,
                template_model,
                tag="sql_alert",
            )
