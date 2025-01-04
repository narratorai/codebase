from datetime import timedelta
from random import random
from time import monotonic
from typing import Any

from core.logger import get_logger
from core.v4.query_runner import BaseSQLQueryRunner

logger = get_logger()


class Connection:
    """
    Connection class to handle the connection to the warehouse
    """

    query_runner: BaseSQLQueryRunner
    warehouse_conn: Any
    pool: Any
    expire_at: float
    created_at: float
    max_idle_lifetime: float

    def __init__(self, *, query_runner: BaseSQLQueryRunner, pool: Any, max_idle_lifetime: float, **kwargs):
        """
        :param query_runner: The query runner to use to run queries
        :param pool: The pool this connection belongs to
        :param max_idle_lifetime: The maximum time a connection can be idle
        """
        self.query_runner = query_runner
        self.warehouse_conn = self.query_runner._get_connection()
        self.created_at = monotonic()
        self.pool = pool
        self.max_idle_lifetime = max_idle_lifetime

        self.__reset_idle_timer()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        # Returning False to propagate any exceptions occurred within the 'with' block
        return False

    def __repr__(self):
        return str(id(self))

    def run_query(self, query: str):
        try:
            logger.info("DB QUERY Running query", query=query)
            return self.query_runner.run_query(query, input_connection=self.warehouse_conn)
        finally:
            self.__reset_idle_timer()

    def cancel_query(self, query: str):
        try:
            logger.info("Cancelling query", query=query)
            return self.query_runner.cancel_query(query, input_connection=self.warehouse_conn)
        finally:
            self.__reset_idle_timer()

    def close(self):
        logger.debug("Dispose of the connection")
        try:
            self.query_runner._dispose_connection(self.warehouse_conn)
        except Exception:
            logger.exception("Failed to close connection")

    def expire(self):
        # Make it so old so it is discarded when returned to the pool
        self.expire_at = monotonic() - timedelta(days=10).total_seconds()

    @property
    def expired(self):
        return monotonic() > self.expire_at

    def __reset_idle_timer(self):
        # Set an expiry date, with some randomness to avoid mass reconnection
        self.expire_at = monotonic() + self.jitter(self.max_idle_lifetime, -0.05, 0.0)

    @classmethod
    def jitter(cls, value: float, min_pc: float, max_pc: float) -> float:
        """
        Add a random value to *value* between *min_pc* and *max_pc* percent.
        """
        return value * (1.0 + ((max_pc - min_pc) * random()) + min_pc)  # noqa: S311
