import contextlib

import dramatiq
from dramatiq import Retry
from dramatiq.brokers.redis import RedisBroker
from dramatiq.brokers.stub import StubBroker
from dramatiq.middleware import AgeLimit, Callbacks, CurrentMessage, Retries, SkipMessage, TimeLimit
from dramatiq.middleware import Shutdown as ShutdownError
from dramatiq.results import Results
from dramatiq.results.backends.redis import RedisBackend as ResultsBackend
from dramatiq.results.backends.stub import StubBackend as ResultsStubBackend
from dramatiq_abort import Abortable
from dramatiq_abort.backends import RedisBackend as AbortBackend

from core.models.settings import settings

from .middleware import Dedup, Shutdown

TWO_MINUTES = 120_000
ONE_HOUR_MS = 3_600_000
TWELVE_HOURS = 43_200_000
ONE_DAY_MS = 86_400_000


class SilentRedisBroker(RedisBroker):
    """
    A Redis broker that catches the SkipMessage exception thrown by the Dedup middleware.
    """

    def enqueue(self, message, *, delay=None):
        with contextlib.suppress(SkipMessage):
            return super().enqueue(message, delay=delay)


if settings.is_test:
    broker = StubBroker(
        middleware=[
            TimeLimit(time_limit=TWELVE_HOURS),
            AgeLimit(max_age=ONE_DAY_MS),
            Shutdown(notify_shutdown=True),
            Callbacks(),
            Retries(),
            Results(backend=ResultsStubBackend()),
        ]
    )
    broker.emit_after("process_boot")
else:
    from core.util.redis import redis_client

    broker = SilentRedisBroker(
        client=redis_client,
        middleware=[
            TimeLimit(time_limit=TWELVE_HOURS, interval=60_000),
            AgeLimit(max_age=ONE_DAY_MS),
            Shutdown(notify_shutdown=True),
            Callbacks(),
            Retries(
                min_backoff=TWO_MINUTES,
                max_backoff=TWELVE_HOURS,
                retry_when=lambda _, e: isinstance(e, Retry | ShutdownError),
            ),
            Abortable(backend=AbortBackend(client=redis_client), abort_ttl=ONE_HOUR_MS),
            CurrentMessage(),
            Results(backend=ResultsBackend(client=redis_client), result_ttl=ONE_DAY_MS),
            Dedup(),
        ],
    )

dramatiq.set_broker(broker)
