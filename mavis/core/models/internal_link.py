import json
import urllib
from base64 import b64encode
from dataclasses import dataclass

from core.models.settings import settings

PORTAL_URL = f"https://{'portal-nonprod' if settings.stage == 'staging' else 'portal'}.narrator.ai"


def urlify(c):
    """
    snake cases a label
    """
    return urllib.parse.quote(c)


@dataclass
class InternalLink:
    company_slug: str

    @property
    def portal(self):
        return f"{PORTAL_URL}/{self.company_slug}"

    def narrative(self, slug, override_company_slug=None, type=None):
        path = "dashboards" if type == "dashboard" else "narratives"
        return f"{PORTAL_URL}/{override_company_slug or self.company_slug}/{path}/a/{slug}"

    def dataset(self, slug, group_slug=None, plot_slug=None):
        link = f"{self.portal}/datasets/edit/{slug}"
        if group_slug:
            link += f"?group={group_slug}"
        if plot_slug:
            link += f"&plot_slug={plot_slug}&view=plot"

        return link

    def kpi(self, kpi_id):
        return f"{self.portal}/kpi/{kpi_id}/edit"

    def activity(self, activity_id):
        return f"{self.portal}/activities/edit/{activity_id}"

    def transformation(self, transformation_id):
        return f"{self.portal}/transformations/edit/{transformation_id}"

    def customer_journey(self, customer):
        return self._customer_journey(self.company.tables[0].activity_stream, customer)

    def customer_journey_w_stream(self, stream, customer):
        return self._customer_journey(stream, customer)

    def customer_journey_w_stream_w_activities(self, stream, customer, activities):
        return self._customer_journey(stream, customer, activities=activities)

    def customer_journey_w_stream_w_timestamp(self, stream, customer, timestamp):
        return self._customer_journey(stream, customer, timestamp=timestamp)

    def customer_journey_w_stream_w_activities_w_timestamp(self, stream, customer, activities, timestamp):
        return self._customer_journey(stream, customer, activities, timestamp)

    def _customer_journey(self, stream, customer, activities=None, timestamp=None):
        # https://portal.narrator.ai/narrator/customer_journey/internal_stream?activities=made_payment,received_income&customer=accounts%20receivable&customer_kind=customer&timestamp=2022-10-03T04%3A00%3A00.000Z

        url = f"{self.portal}/customer_journey/{stream}"
        params = dict(customer_kind="join_customer", customer=customer)

        if activities:
            params["activities"] = ",".join(activities)

        if timestamp:
            params["timestamp"] = timestamp

        # get the params
        param_str = "&".join([f"{k}={urlify(v)}" for k, v in params.items()])

        return f"{url}?{param_str}"

    def narrative_param(self, slug, key, value):
        params = b64encode(json.dumps({key: value}).encode()).decode()
        return self.narrative(f"{slug}/{params}")
