import json
from typing import Literal

from pydantic import BaseModel

from core.decorators import with_mavis
from core.decorators.task import mutex_task
from core.logger import get_logger
from core.util.llm import text_to_vector
from core.util.opensearch import opensearch_client
from core.utils import slugify
from core.v4.mavis import Mavis

logger = get_logger()


class SoftwareName(BaseModel):
    software_name: str
    producer: str
    version: str
    raw_name: str

    @property
    def content(self):
        return f"{self.software_name} (version: {self.version}) by {self.producer}"


class Software(SoftwareName):
    purpose: str
    description: str
    capabilities: list[str]
    use_cases: list[str]
    compliance: list[str]
    given_price: float
    spend_group: Literal["high", "medium", "low"]


def add_meta(res, company_name):
    res["company_name"] = company_name


def get_idx(company_name):
    return f"clearfind_software_{slugify(company_name)}"


def _process_row(r: dict):
    add_meta(r, r["company_name"])
    r["id"] = r["id"]
    for k in ["use_cases", "capabilities", "compliance"]:
        if r[k] is None:
            r[k] = []
        else:
            if isinstance(r[k], str) and r[k].strip().startswith("["):
                r[k] = json.loads(r[k])

            if not isinstance(r[k], list):
                r[k] = [r[k]]

    r = {k: v for k, v in r.items() if not k.startswith("_")}
    r["vec"] = text_to_vector(r["description"])

    # index the item
    try:
        opensearch_client.index(index=get_idx(r["company_name"]), id=str(int(r["id"])), body=r)
    except Exception as e:
        logger.error(f"IN Processing: Failed to index {r['id']}: {e}")
    return r


@mutex_task(queue_name="transformations", time_limit=360_000_000)
@with_mavis
def samplify_reindex(mavis: Mavis, **kwargs):
    query = """
        SELECT r._created, s.company_name, s.software_id as id, s.software_name, s.capabilities, s.compliance, s.purpose, s.producer, s.description, s.spend_group, s.use_cases
        FROM webhooks.refine_software r
        JOIN webhooks.refine_software r2
            on (r2.id = r.combined_with and r2.combined_with= r.id and r.company_name = r2.company_name)
        JOIN narrator_clearfind.software s
            on (s.company_name = r.company_name and s.software_id =r.id)
    """
    query = """


    """
    data = mavis.run_query(query)
    for r in data.rows:
        _process_row(r)
