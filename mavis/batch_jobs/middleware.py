"""
Middlewares for dramatiq.
"""

import gc

from dramatiq.brokers.redis import RedisBroker
from dramatiq.errors import DecodeError
from dramatiq.message import Message
from dramatiq.middleware import Middleware, ShutdownNotifications, SkipMessage

from core.logger import get_logger

logger = get_logger()


class Shutdown(ShutdownNotifications):
    def after_worker_shutdown(self, broker, worker):
        super().after_worker_shutdown(broker, worker)

        self._dispose_connections()

    def _dispose_connections(self):
        from core.util.db.pool import pool_cache

        logger.debug("Disposing connections")
        pool_cache.clear()
        gc.collect()  # Force garbage collection to close all connections


class Dedup(Middleware):
    """
    Middleware to deduplicate messages. In the context of Narrator, no message should be enqueued twice.
    """

    def before_enqueue(self, broker: RedisBroker, message: Message, delay: int):
        messages_queue = f"{broker.namespace}:{message.queue_name}.msgs"

        if self.find_similar_message(broker, messages_queue, message):
            logger.warn(
                "Skipping message",
                message_id=message.message_id,
                actor_name=message.actor_name,
                **message.kwargs,
            )
            raise SkipMessage()

    def find_similar_message(self, broker: RedisBroker, queue_name: str, message: Message):
        # HSCAN doesn't block the redis server like KEYS does
        for key, item in broker.client.hscan_iter(queue_name, count=100):
            try:
                if isinstance(item, bytes):
                    enqueued_message = Message.decode(item)
                else:
                    enqueued_message = Message.decode(item.encode("utf-8"))
            except (DecodeError, AttributeError):
                logger.exception("Failed to decode dramatiq message", message_id=key)
                continue

            if self._are_equal(enqueued_message, message):
                return enqueued_message

    def _are_equal(self, enqueued_message: Message, message: Message):
        """
        Check if the given messages are equal.
        """
        actor_name = message.actor_name
        kwargs = message.kwargs
        args = message.args

        return (
            enqueued_message.actor_name == actor_name
            and enqueued_message.args == args
            and enqueued_message.kwargs == kwargs
        )
