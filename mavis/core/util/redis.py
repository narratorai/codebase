import redis

from core.models.settings import settings

redis_url = settings.redis_url
redis_client = redis.from_url(url=redis_url, retry_on_timeout=True)
