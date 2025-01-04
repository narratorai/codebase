from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core.constants import ALL_TEMPORAL_JOIN_TEMPLATES
from core.decorators import with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import (
    transformation_kinds_enum,
    transformation_update_types_enum,
)
from core.models.company import Company
from core.v4.mavis import Mavis


def _delete_company_tables(company: Company, tasks: CustomTask):
    for t in company.tables:
        tasks.add_task("delete_recent_updates", days=14, table=t.activity_stream)
        # tasks.add_task("reset_identity", table=t.activity_stream)
    tasks.update()


def _add_tutorials(mavis: Mavis):
    activities = graph_client.activity_index(mavis.company.id).all_activities
    for tem in ALL_TEMPORAL_JOIN_TEMPLATES:
        mavis.add_run_transformation_task(
            "run_narrative_template",
            template_name=tem,
            skip_email=True,
            activity_id=activities[0].id,
        )

    mavis.add_run_transformation_task("email_about_templates")


def _delete_incremental_trans_tables(company: Company, tasks: CustomTask):
    all_trans = graph_client.transformation_index(company.id).all_transformations

    tables = {
        t.table
        for t in all_trans
        if t.update_type
        in (
            transformation_update_types_enum.regular,
            transformation_update_types_enum.mutable,
        )
        and t.kind != transformation_kinds_enum.stream
    }

    for t in tables:
        tasks.add_task("delete_recent_updates", days=2, table=t)
    tasks.update()


def _delete_identity(company: Company):
    tasks = []
    for t in company.tables:
        tasks.append(dict(task="reset_identity", table=t.activity_stream))

    return tasks


@with_mavis
def add_processing_task(mavis: Mavis, company_slug=None):
    # _update_internal_access(mavis, True)
    tasks = CustomTask(mavis.company.s3, TaskKindEnum.run_transformation)
    _delete_company_tables(mavis.company, tasks)
