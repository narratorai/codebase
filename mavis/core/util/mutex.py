import hashlib
from collections import defaultdict
from collections.abc import Callable
from urllib.parse import urlencode

from dramatiq.rate_limits.backends import RedisBackend as RateLimitRedisBackend
from dramatiq.rate_limits.backends import StubBackend
from portalocker import RedisLock

from core.models.settings import settings

from .redis import redis_client

if settings.is_test:
    mutex_backend = StubBackend()
else:
    mutex_backend = RateLimitRedisBackend(client=redis_client)


class MutexFactory:
    @classmethod
    def create(cls, key: str):
        """
        Create a mutex. The lock is automatically released when the function ends.

        :param key: The key to use for the mutex
        :return: The lock
        """
        return RedisLock(key, connection=redis_client, timeout=0, fail_when_locked=True)


def create_mutex_key(company_slug: str, fn: Callable, kwargs: dict, check_args=False):
    # Remove the task_id to lock the task regardless of the ID of the task
    kwargs_copy = defaultdict(dict, kwargs)
    kwargs_copy.pop("task_id", None)
    sorted_kwargs = sorted(kwargs_copy.items())
    encoded_kwargs = hashlib.sha1(urlencode(sorted_kwargs).encode(), usedforsecurity=False)

    key = f"worker_mutex:{company_slug}:{fn.__name__}"
    key = f"{key}:{encoded_kwargs.hexdigest()}" if check_args else key

    return key
