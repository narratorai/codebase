from enum import StrEnum

from core.errors import InvalidServiceLimit
from core.graph import graph_client
from core.utils import date_add, utcnow


class ServiceLimit(StrEnum):
    ACTIVITY = "activity"
    TRANSFORMATIONS = "transformations"
    DATASETS = "datasets"
    MATERIALIZATIONS = "materializations"
    ROW_LIMIT = "row_limit"
    ACTIVITY_STREAM_LIMIT = "activity_stream_limit"
    NARRATIVES = "narratives"
    DISABLE_ON = "disable_on"


def check_limit(company_id: str, limit: ServiceLimit, count: int | None = None) -> bool:
    return None
    # company_limit = self._get_company_limit()

    # if company_limit.disable_on is not None:
    #     limit_name = "Trial Period Days"
    #     count = utils.date_diff(self.company.created_at, utils.utcnow(), "day")
    #     count_limit = utils.date_diff(
    #         self.company.created_at, company_limit.disable_on, "day"
    #     )
    # else:
    #     # get the current value of the limit
    #     (count, limit_name) = self._get_current_limit(service_limit, count)

    #     count_limit = getattr(company_limit, limit_name)

    # beeline.add(dict(count_limit=count_limit, count=count))

    # if count and count_limit is not None:
    #     count_limit = int(count_limit)
    #     keys = dict(
    #         limit_name=utils.title(limit_name),
    #         count=utils.human_format(count, "number"),
    #         count_limit=utils.human_format(count_limit, "number"),
    #     )
    #     if count >= count_limit:
    #         raise ServiceLimitError(limit_name, count)
    #     elif count * 0.9 > count_limit:
    #         return utils.Notification(
    #             message="90% Service Limit Reached",
    #             description="You are currently at 90% of your {limit_name}: {count}/{count_limit}.  Please reach out to sales@narrator.ai or visit the company page to upgrade.".format(
    #                 **keys
    #             ),
    #             duration=0,
    #             type=utils.NotificationTypeEnum.ERROR,
    #         )
    #     elif count * 0.8 > count_limit:
    #         return utils.Notification(
    #             message="80% Service Limit Reached",
    #             description="You are currently at 80% of your {limit_name}: {count}/{count_limit}. Please reach out to sales@narrator.ai or visit the company page to upgrade.".format(
    #                 **keys
    #             ),
    #             duration=5,
    #             type=utils.NotificationTypeEnum.WARNING,
    #         )


def _get_company_limit(company_id):
    company_limits = graph_client.get_service_limit(company_id=company_id).service_limit

    # if there is no service limit then use the free tier service limit
    if len(company_limits) == 0:
        company_limit = graph_client.insert_default_service_limit(
            company_id=company_id,
            disable_on=date_add(utcnow(), "month", 2)[:10],
        ).insert_service_limit_one
    else:
        # grab the company limit
        company_limit = company_limits[0]

    return company_limit


def _get_current_limit(company_id, service_limit, count=None):
    if ServiceLimit.ACTIVITY == service_limit:
        limit_name = "activity_limit"
        if not count:
            count = graph_client.get_activity_count(company_id=company_id).activity_aggregate.aggregate.count

    elif ServiceLimit.TRANSFORMATIONS == service_limit:
        limit_name = "transformation_limit"
        if not count:
            count = graph_client.get_transformation_count(
                company_id=company_id
            ).transformation_aggregate.aggregate.count

    elif ServiceLimit.DATASETS == service_limit:
        limit_name = "dataset_limit"
        if not count:
            count = graph_client.get_dataset_count(company_id=company_id).dataset_aggregate.aggregate.count

    elif ServiceLimit.MATERIALIZATIONS == service_limit:
        limit_name = "materialization_limit"

        if not count:
            count = graph_client.get_materialization_count(
                company_id=company_id
            ).dataset_materialization_aggregate.aggregate.count

    elif ServiceLimit.ROW_LIMIT == service_limit:
        limit_name = "row_limit"
        # count = (
        #     apply_function(
        #         "max", [int(t.row_count) for t in self.company.tables if t.row_count]
        #     )
        #     or 0
        # )

    elif ServiceLimit.ACTIVITY_STREAM_LIMIT == service_limit:
        limit_name = "activity_stream_limit"
        # count = len(self.company.tables)

    elif ServiceLimit.NARRATIVES == service_limit:
        limit_name = "narrative_limit"
        if not count:
            count = graph_client.get_narrative_count(company_id=company_id).narrative_aggregate.aggregate.count

    elif ServiceLimit.DISABLE_ON == service_limit:
        count = utcnow()
        limit_name = "Trial Time Limit"
    else:
        raise InvalidServiceLimit(f"Found invalid option: {service_limit.value}")

    return (count, limit_name)
