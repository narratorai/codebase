import backoff
from requests import post

from core.decorators.task import task


@task(queue_name="run_query")
@backoff.on_predicate(
    backoff.expo,
    lambda x: x is not None and x.status_code >= 300,
    max_tries=4,  # 3 retries + initial attempt
    max_time=30,
)
def async_post(url: str, body: dict, headers: dict | None = None):
    res = post(url=url, data=body, timeout=30, headers=headers)
    if res.status_code >= 200 and res.status_code < 300:
        return None
    return res
