import threading
from collections.abc import Callable
from contextlib import contextmanager
from dataclasses import dataclass
from queue import Empty, Full, Queue
from time import monotonic

import backoff
from backoff import on_exception
from cachetools import LRUCache, cached

from core.logger import get_logger

from .connection import Connection
from .errors import ConnectionExpired, OperationalError, PoolClosed, PoolTimeout

logger = get_logger()
pool_cache = LRUCache(maxsize=1_000)


@dataclass
class ConnectionPool:
    """
    A pool of connections to a database.

    Extracted from psycopg2.pool.ConnectionPool.
    """

    name: str
    connection_factory: Callable[..., Connection]
    max_size: int
    max_lifetime: float
    timeout: float

    _pool: Queue
    _lock: threading.RLock
    _check: Callable[[Connection], None] | None
    _nconns: int
    """Connections currently in the pool, out or being prepared"""

    _opened: bool
    _closed: bool
    """Time when ALL the connections in the pool were last expired"""

    def __init__(
        self,
        name: str,
        *,
        connection_factory: Callable[..., Connection],
        max_size: int,
        max_lifetime: float,
        timeout: float,
        check: Callable[[Connection], None] | None = None,
    ):
        self.name = name
        self.connection_factory = connection_factory
        self.max_size = max_size
        self.max_lifetime = max_lifetime
        self.timeout = timeout

        self._check = check
        self._pool = Queue(maxsize=max_size)
        self._nconns = 0

        # Flag to allow the pool to grow only one connection at time. In case
        # of spike, if threads are allowed to grow in parallel and connection
        # time is slow, there won't be any thread available to return the
        # connections to the pool.
        self._growing = False

        self._opened = False
        self._closed = True

        self._open()

    def __del__(self):
        # If the '_closed' property is not set we probably failed in __init__.
        # Don't try anything complicated as probably it won't work.
        if getattr(self, "_closed", True):
            return

        self.close()

    @contextmanager
    def connection(self, timeout: float | None = None, **kwargs):
        """Context manager to obtain a connection from the pool.

        Return the connection immediately if available, otherwise wait up to
        *timeout* or `self.timeout` seconds and throw `PoolTimeout` if a
        connection is not available in time.

        Upon context exit, return the connection to the pool.
        """
        t0 = monotonic()
        conn = self.getconn(timeout=timeout, **kwargs)

        try:
            with conn:
                yield conn
        finally:
            self.putconn(conn)

            t1 = monotonic()
            logger.info(
                "Connection context closed",
                pool=self.name,
                connection=conn,
                duration=f"{(t1 - t0):.2f}",
            )

    def getconn(self, timeout: float | None = None, **kwargs) -> Connection:
        """Obtain a connection from the pool.

        You should preferably use `connection()`. Use this function only if
        it is not possible to use the connection as context manager.

        After using this function you *must* call a corresponding `putconn()`:
        failing to do so will deplete the pool. A depleted pool is a sad pool:
        you don't want a depleted pool.
        """
        timeout = self.timeout if timeout is None else timeout

        self._check_open_getconn()
        return self._getconn_with_check(timeout=timeout, **kwargs)

    def putconn(self, conn: Connection):
        """Return a connection to the loving hands of its pool.

        Use this function only paired with a `getconn()`. You don't need to use
        it if you use the much more comfortable `connection()` context manager.
        """
        # Quick check to discard the wrong connection
        self._check_pool_association(conn)

        if self._maybe_close_connection(conn):
            return

        self._return_connection(conn)

    def reset_old(self, timeout: float):
        """Expire all connections older than `max_lifetime` and close them."""
        with self._lock:
            reset_at = monotonic() - timeout
            if any(conn.created_at < reset_at for conn in self._pool.queue):
                logger.info("Resetting old connections", pool=self.name)
                self.expire_all()

    def expire_all(self):
        """Expire all connections in the pool and close them."""
        logger.debug("Expiring all connections", pool=self.name)
        for conn in list(self._pool.queue):
            conn.expire()
            conn.close()

        with self._lock:
            self._pool.queue.clear()
            self._nconns = 0

    def close(self):
        """Close the pool and make it unavailable to new clients.

        All the waiting and future clients will fail to acquire a connection
        with a `PoolClosed` exception. Currently used connections will not be
        closed until returned to the pool.
        """
        if self._closed:
            return

        with self._lock:
            self._closed = True
            logger.info("Pool closed", pool=self.name, nconns=self._nconns)

            # Take waiting client and pool connections out of the state
            connections: list[Connection] = list(self._pool.queue)
            self._pool.queue.clear()

        # Now that the flag _closed is set, getconn will fail immediately,
        # putconn will just close the returned connection.
        # Close the connections still in the pool
        logger.debug("Closing connections cause pool is closing", pool=self.name, nconns=len(connections))
        for conn in connections:
            conn.close()

    def _open(self):
        if not self._closed:
            return

        self._check_open()
        self._ensure_lock()

        self._closed = False
        self._opened = True

    def _ensure_lock(self):
        """Make sure the pool lock is created."""

        try:
            assert self._lock is not None
        except (AttributeError, AssertionError):
            self._lock = threading.RLock()

    def _check_open(self):
        if self._closed and self._opened:
            raise OperationalError(f"The pool {self.name!r} has already been opened/closed and cannot be reused")

    def _check_open_getconn(self):
        if self._closed:
            if self._opened:
                raise PoolClosed(f"The pool {self.name!r} is already closed")
            else:
                raise PoolClosed(f"The pool {self.name!r} is not open yet")

    @on_exception(backoff.constant, ConnectionExpired, max_tries=15, logger=logger)
    def _getconn_with_check(self, timeout: float, **kwargs):
        try:
            conn = self._getconn_unchecked(timeout=timeout, **kwargs)
        except Empty as e:
            logger.warn("Pool exhausted", pool=self.name, nconns=self._nconns)
            raise PoolTimeout() from e

        try:
            self._check_connection(conn)
        except Exception:
            self._return_connection(conn)
            raise
        else:
            logger.info(
                "Connection given",
                pool=self.name,
                connection=conn,
                pool_size=self._pool.qsize(),
                nconns=self._nconns,
            )
            return conn

    @on_exception(backoff.expo, Empty, max_tries=3, logger=logger)
    def _getconn_unchecked(self, timeout: float, **kwargs) -> Connection:
        # Critical section: decide here if there's a connection ready
        # or if a new one should be created.
        with self._lock:
            if self._pool.qsize() == 0:
                # If there is space for the pool to grow, let's do it
                self._maybe_grow_pool(**kwargs)

        # Note that this makes it a bit longer than the provided timeout
        conn: Connection = self._pool.get(timeout=timeout / 3)

        # Tell the connection it belongs to a pool to avoid closing on __exit__
        # Note that this property shouldn't be set while the connection is in
        # the pool, to avoid to create a reference loop.
        conn.pool = self
        return conn

    def _maybe_grow_pool(self, **kwargs):
        # Allow only one task at time to grow the pool (or returning connections might be starved).
        if self._nconns >= self.max_size or self._growing:
            logger.warn(
                "Cannot grow pool",
                pool=self.name,
                nconns=self._nconns,
                max_size=self.max_size,
                growing=self._growing,
            )
            return

        self._growing = True
        self._add_connection(growing=self._growing, **kwargs)

    def _add_connection(self, growing: bool = False, **kwargs):
        """Try to connect and add the connection to the pool.

        If failed, reschedule a new attempt in the future for a few times, then
        give up, decrease the pool connections number and call
        `self.reconnect_failed()`.
        """
        conn = None

        try:
            conn = self._connect(**kwargs)
            self._add_to_pool(conn)
        except Exception:
            logger.exception("Error connecting to the database", pool=self.name)
            raise
        else:
            if growing:
                with self._lock:
                    self._nconns += 1  # Increase only after the connection is added to the pool
        finally:
            if growing:
                with self._lock:
                    self._growing = False

            logger.debug(
                "Added new connection to the pool",
                pool=self.name,
                connection=conn,
                nconns=self._nconns,
                growing=growing,
            )

    def _connect(self, timeout: float | None = None, **kwargs):
        """Return a new connection configured for the pool."""
        try:
            conn = self.connection_factory(self.name, pool=self, max_idle_lifetime=self.max_lifetime, **kwargs)
        except Exception:
            logger.exception("Error creating connection", pool=self.name)
            raise
        else:
            if conn is None:
                raise OperationalError("Cannot obtain a connection to the warehouse")

        return conn

    def _check_pool_association(self, conn: Connection):
        pool = conn.pool
        if pool is self:
            return True

        if pool:
            msg = f"it comes from pool {pool.name!r}"
        else:
            msg = "it doesn't come from any pool"
        raise ValueError(f"can't return connection to pool {self.name!r}, {msg}: {conn}")

    def _maybe_close_connection(self, conn: Connection):
        """Close a connection that is trying to return to the pool if necessary.

        If the pool is closed or was reset while a connection was not in the pool, just close the
        connection instead of returning it to the pool.

        Return `True` if the connection was closed and should not be returned to the pool.
        """
        if not self._closed:
            return False

        # For extra refcare remove the pool reference from it.
        conn.pool = None
        logger.debug("Pool is closed, closing connection", pool=self.name, connection=conn)
        conn.close()
        return True

    def _return_connection(self, conn: Connection):
        """
        Return a connection to the pool after usage.
        """

        def close_conn():
            conn.close()
            with self._lock:
                self._nconns -= 1

        # Check if the connection is past its best before date
        if conn.expired:
            logger.debug(
                "Connection expired",
                pool=self.name,
                connection=conn,
                expired_at=conn.expire_at,
                monotonic=monotonic(),
            )
            close_conn()
            return False

        try:
            self._add_to_pool(conn)
            logger.info(
                "Connection returned to the pool",
                pool=self.name,
                connection=conn,
                pool_size=self._pool.qsize(),
                nconns=self._nconns,
            )
        except Full:
            logger.exception("Error returning connection to pool", pool=self.name, connection=conn)
            close_conn()
            return False
        else:
            return True

    def _add_to_pool(self, conn: Connection):
        """
        Add a connection to the pool.

        The connection can be a fresh one or one already used in the pool.
        """
        # Remove the pool reference from the connection before returning it,
        # to the pool, to avoid to create a reference loop.
        conn.pool = None

        # Critical section: Put the connection back into the pool.
        self._pool.put(conn, timeout=10.0)

    def _check_connection(self, conn: Connection):
        if conn.expired:
            raise ConnectionExpired()

        try:
            if self._check:
                self._check(conn)
        except Exception:
            logger.exception("Connection failed check", pool=self.name)
            raise


@cached(cache=pool_cache, key=lambda name, *args, **kwargs: name)
def create_cached_pool(
    name: str,
    *,
    connection_factory: Callable,
    max_size: int,
    max_lifetime: float = 1_800.0,
    timeout: float = 30.0,
):
    """
    Create a new connection pool.

    IMPORTANT: The pool will be cached only by name.

    :param name: The name of the pool.
    :param connection_factory: A callable that returns a new connection.
    :param max_size: The maximum number of connections the pool will hold.
    :param max_lifetime: The maximum time a connection can be held by the pool.
    :param timeout: The maximum time to wait for a connection from the pool.
    """
    return ConnectionPool(
        name,
        connection_factory=connection_factory,
        max_size=max_size,
        max_lifetime=max_lifetime,
        timeout=timeout,
    )
