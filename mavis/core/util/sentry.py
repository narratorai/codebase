from collections.abc import Sequence

import sentry_sdk

from core.models.settings import settings


def configure(*, ignore_errors: Sequence[type | str] | None = None):
    sentry_sdk.init(
        dsn=settings.sentry_dsn.get_secret_value(),
        traces_sample_rate=settings.sentry_traces_sample_rate,
        environment=settings.env,
        server_name=settings.datacenter_region,
        ignore_errors=ignore_errors or [],
        enable_tracing=settings.is_production,
    )
