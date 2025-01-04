import base64
import json

from core import utils
from core.api.customer_facing.tasks.utils import TaskManager
from core.constants import SQL_ALERT_EMAIL_TEMPLATE
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.models.internal_link import PORTAL_URL
from core.util.email import send_email
from core.v4.mavis import Mavis

logger = get_logger()


@mutex_task()
@with_mavis
def run_sql_query_alert(mavis: Mavis, **kwargs):
    # support both old and new structure
    alert_id = kwargs.get("alert_id") or kwargs.get("id")

    alert = graph_client.get_alert(id=alert_id).company_query_alert_by_pk

    if alert is None:
        if kwargs.get("task_id"):
            TaskManager(mavis=mavis).delete(id=kwargs.get("task_id"))
        return None

    if alert.sql_query.related_to != alert.sql_query.related_to.transformation:
        return None

    graph_transform = graph_client.get_transformation_for_processing(id=alert.sql_query.related_id).transformation

    # the transformation has been deleted
    if not graph_transform:
        graph_client.delete_all_alerts_with_tasks(
            related_to="transformation",
            related_id=alert.sql_query.related_id,
            related_kind="validation",
        )
        return None

    query = mavis.qm.Query()

    # add the activity as a field that we can use
    if len(graph_transform.production_queries) > 0:
        query.add_fields(production_query=f"(\n {graph_transform.production_queries[0].sql} \n )")

    # create the query
    query.add_column(mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.set_from(mavis.qm.Table(sql=alert.sql_query.sql))
    data = mavis.run_query(query.to_query())

    if data.total_rows == 0:
        total_rows = 0
    else:
        total_rows = data.rows[0]["total_rows"] or 0

    if (total_rows > 0 and alert.alert_kind == alert.alert_kind.returns_rows) or (
        total_rows == 0 and alert.alert_kind == alert.alert_kind.returns_no_rows
    ):
        logger.info("Send the alert")
        template_model = dict(
            utm_medium="email",
            utm_content="alert",
            alert=alert.dict(),
            name=utils.title(alert.company_task.task_slug),
            total_rows=total_rows,
            kind="transformations",
        )
        if 0 < total_rows < 1000:
            # get the data
            query = mavis.qm.wrap_query(mavis.qm.Table(sql=alert.sql_query.sql)).to_query()
            data = mavis.run_query(query)

            # upload the data to the temp folders
            upload_to = mavis.company.s3.upload_object(
                data.to_csv(),
                [
                    "alert_uploads",
                    f"{alert.company_task.task_slug}-{utils.utcnow()}.csv",
                ],
            )

            path = json.dumps(dict(s3_path=upload_to, type="alert"))
            encoded_path = base64.urlsafe_b64encode(path.encode("ascii")).decode()
            template_model["download_url"] = f"{PORTAL_URL}/{mavis.company.slug}/downloads/{encoded_path}"

        send_email(
            mavis.company,
            alert.email,
            SQL_ALERT_EMAIL_TEMPLATE,
            template_model,
            tag="sql_alert",
        )
