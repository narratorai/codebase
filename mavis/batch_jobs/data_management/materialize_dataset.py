from time import sleep

from dramatiq import Retry
from opentelemetry.trace import get_current_span

from core.api.customer_facing.datasets.utils import DatasetManager
from core.decorators import mutex_task, with_mavis
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.util.mutex import create_mutex_key
from core.util.redis import redis_client
from core.v4.dataset_comp.integrations.model import Materialization
from core.v4.dataset_comp.integrations.runner import run_materialization
from core.v4.dataset_comp.integrations.util import SuccessAndRun
from core.v4.mavis import Mavis

logger = get_logger()


@mutex_task(time_limit=150_000_000, queue_name="datasets")
@with_mavis
def materialize_dataset(
    mavis: Mavis,
    materialization_attrs: dict | None = None,
    materialization_id: UUIDStr | None = None,
    **kwargs,
):
    # DEPRECATE SOON
    _check_run(mavis)

    task_id = kwargs.get("task_id")
    # get the materialization
    if materialization_id:
        get_current_span().set_attribute("materialization_id", str(materialization_id))
        materialization = DatasetManager(mavis=mavis).get_materialization(materialization_id)
    else:
        materialization = Materialization(**materialization_attrs)

    try:
        run_materialization(mavis, materialization, materialization_id)
    except SuccessAndRun as e:
        if materialization_id:
            materialize_dataset.send_with_options(
                kwargs=dict(
                    company_slug=mavis.company.slug,
                    materialization_id=materialization_id,
                    task_id=task_id,
                ),
                delay=e.delay or 300_000,
            )


def _check_run(mavis: Mavis):
    # Run the materializaiton
    from batch_jobs.data_management.run_transformations import run_transformations

    key = create_mutex_key(mavis.company.slug, run_transformations.fn, {}, False)

    # Wait 10 minutes for run_transformation to be available
    iterations = 120
    for _ in range(iterations):
        if redis_client.get(key) and redis_client.get(key).decode() != "0":
            sleep(5)
            logger.debug("Waiting for run_transformation to be available", mutex_key=key)
        else:
            return None
    else:
        raise Retry("run_transformation mutex not available")
