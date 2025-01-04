import random

import structlog

from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

logger = structlog.get_logger()
PERCENT_TEST = 0.05


@mutex_task()
@with_mavis
def compile_all_queries_test(mavis: Mavis, **kwargs):
    """
    UPDATE_ACTIVITY_STREAM: updates the data for the activity stream
    """
    total = dict(ran=0, seen=0)
    datasets = graph_client.dataset_index(company_id=mavis.company.id).dataset

    for d in datasets:
        logger.info(f"Testing {d.name}")

        dataset = Dataset(mavis, d.id, limit=10)
        if random.random() < PERCENT_TEST:  # noqa: S311
            dataset.run()
            total["ran"] += 1
        else:
            dataset.sql()
            total["seen"] += 1

        # each tab
        for group in dataset.model.all_tabs:
            if random.random() < PERCENT_TEST:  # noqa: S311
                dataset.run(group.slug)
                total["ran"] += 1
            else:
                dataset.sql(group.slug)
                total["seen"] += 1

        logger.info(f"RAN: {total['ran']} out of {total['seen']}")
