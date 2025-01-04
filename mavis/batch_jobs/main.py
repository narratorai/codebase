"""
This is the entrypoint for the dramatiq worker.

Import all tasks here to make the worker aware of them.
"""

from dramatiq.middleware import Shutdown
from dramatiq_abort.abort_manager import Abort

from core.api.customer_facing.reports.utils import async_log_filter_use, async_resync_image
from core.api.customer_facing.trainings.utils import async_train_on_dataset
from core.api.customer_facing.utils.updator import async_log_view
from core.api.v1.endpoints.admin.company import refresh_company_cache
from core.api.v1.narrative.helpers import log_narrative_view
from core.errors import SilenceError
from core.logger import configure_logging
from core.models.settings import settings
from core.util.email import send_email
from core.util.opentelemetry import configure as configure_opentelemetry
from core.util.sentry import configure as configure_sentry
from core.v4.blocks.transformation_context_v2 import async_push_to_production
from core.v4.blocks.transformation_tests import aysnc_run_single_test
from core.v4.dataset_comp.integrations.processors.clearfind_loader import async_load_rows
from core.v4.dataset_comp.integrations.processors.clearfind_opportunity import async_find_opportunity_rows
from core.v4.dataset_comp.integrations.processors.clearfind_refine import async_refine_rows

from .data_bridging.check_fivetran_sync import check_fivetran_sync
from .data_bridging.grant_missing_access import grant_missing_access
from .data_bridging.index_warehouse import index_warehouse
from .data_bridging.run_onboarding import run_onboarding
from .data_management.async_actions import async_post
from .data_management.check_for_new_activities import check_for_new_activities
from .data_management.clean_tables import clean_tables
from .data_management.clear_old_query_updates import clear_old_query_updates
from .data_management.delete_archived_buckets import delete_archived_buckets
from .data_management.index_activity_dims import index_activity_dims
from .data_management.materialize_dataset import materialize_dataset
from .data_management.resync_narrative import resync_narrative
from .data_management.run_narrative import run_narrative
from .data_management.run_narrative_integration import run_narrative_integration
from .data_management.run_query import async_batch_run, async_run_query_raw
from .data_management.run_sql_query_alert import run_sql_query_alert
from .data_management.run_transformations import run_transformations
from .data_management.sync_to_stripe import sync_to_stripe
from .data_management.update_popular_tags import update_popular_tags
from .data_management.validate_stream_assumptions import validate_stream_assumptions
from .maintenance import check_stuck, cleanup
from .monitor import sentry_monitor

configure_logging()
configure_sentry(ignore_errors=[SilenceError, Abort, Shutdown])
configure_opentelemetry(settings.worker_otel_service_name)


__all__ = [
    "async_batch_run",
    "async_load_rows",
    "async_run_query_raw",
    "async_refine_rows",
    "async_find_opportunity_rows",
    "aysnc_run_single_test",
    "async_train_on_dataset",
    "async_post",
    "async_push_to_production",
    "async_log_filter_use",
    "async_resync_image",
    "async_log_view",
    "check_fivetran_sync",
    "check_for_new_activities",
    "check_stuck",
    "clean_tables",
    "cleanup",
    "clear_old_query_updates",
    "delete_archived_buckets",
    "grant_missing_access",
    "index_activity_dims",
    "index_warehouse",
    "log_narrative_view",
    "materialize_dataset",
    "refresh_company_cache",
    "resync_narrative",
    "run_narrative_integration",
    "run_narrative",
    "run_onboarding",
    "run_sql_query_alert",
    "run_transformations",
    "send_email",
    "sentry_monitor",
    "sync_to_stripe",
    "update_popular_tags",
    "validate_stream_assumptions",
]
