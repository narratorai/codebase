import structlog

from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.v4.mavis import Mavis

logger = structlog.get_logger()


def end_all_activity_maintenace(company_id: str):
    all_activities = graph_client.activity_index(company_id=company_id).all_activities

    for a in all_activities:
        for am in a.activity_maintenances:
            graph_client.end_activity_maintenance(id=am.id)


def update_all_task(company_id: str):
    all_trans = graph_client.transformation_index_w_dependency(company_id=company_id).all_transformations

    for transformation in all_trans:
        if len(transformation.transformation_maintenances) == 0:
            for a in transformation.activities:
                for am in a.activity.activity_maintenances:
                    if am.kind == am.kind.query_failed:
                        graph_client.end_activity_maintenance(id=am.id)


@mutex_task()
@with_mavis
def end_maintenance(mavis: Mavis, **kwargs):
    try:
        company_id = mavis.company.id

        update_all_task(company_id)
        end_all_activity_maintenace(company_id)
    except Exception as e:
        logger.error(e)
