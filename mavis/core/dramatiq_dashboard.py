"""
This module exposes a dramatiq management dashboard app.
IMPORTANT: This app should NOT be exposed to customers.

To run the dashboard, use the following command:
    doppler run -c production_us -- gunicorn core.dramatiq_dashboard:app
"""

import dramatiq
from dramatiq_dashboard import DashboardApp

from batch_jobs.dramatiq import broker

broker.declare_queue("default")
broker.declare_queue("datasets")
broker.declare_queue("narratives")
broker.declare_queue("dashboards")
broker.declare_queue("activities")
broker.declare_queue("transformations")
broker.declare_queue("llm")
broker.declare_queue("run_query")

dramatiq.set_broker(broker)
app = DashboardApp(broker=broker, prefix="")
