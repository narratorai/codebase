import functools
from collections.abc import Callable
from datetime import UTC, datetime, timedelta


def ttl_cache(maxsize=128, typed=False, **timedelta_kwargs):
    """
    A wrapper around functools lru_cache, clears the cache after a timedelta
    NOTE that this is a single timeout for all items in the cache
    If we want to start expiring individual items, the cachetools package is the way to go

    Usage:
    @ttl_cache(minutes=15)
    def my_func():
        ...
    """

    def _wrapper(fn: Callable) -> Callable:
        f = functools.lru_cache(maxsize=maxsize, typed=typed)(fn)
        f._lifetime = timedelta(**timedelta_kwargs)
        f._expiration = datetime.now(UTC) + f._lifetime

        @functools.wraps(f)
        def _wrapped(*args, **kwargs):
            now = datetime.now(UTC)
            if now >= f._expiration or kwargs.get("refresh_cache"):
                f.cache_clear()
                f._expiration = now + f._lifetime
            return f(
                *args,
                **{k: v for k, v in (kwargs or {}).items() if k != "refresh_cache"},
            )

        return _wrapped

    return _wrapper
