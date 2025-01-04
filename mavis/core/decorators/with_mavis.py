import gc
import threading
from collections.abc import Callable
from functools import wraps
from typing import Concatenate, ParamSpec, TypeVar

from core.logger import get_logger, set_contextvars
from core.models.company import Company, query_graph_company
from core.models.user import AuthenticatedUser, UserCompany, UserTags
from core.util.opentelemetry import set_current_span_attributes
from core.v4.mavis import Mavis

R = TypeVar("R")
P = ParamSpec("P")

logger = get_logger()


def with_mavis(fn: Callable[Concatenate[Mavis, P], R]):
    """
    Decorator that injects an instance of Mavis into a function.
    If the company of the mavis context has batch_halt on, the function will not be executed.

    For example::
        @with_mavis
        def batch_job(mavis: Mavis, company_slug: str):
            pass

    Note: For FastAPI routes use dependency-injection instead of this decorator.
    """

    @wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs):
        if "company_slug" not in kwargs:
            raise KeyError("company not set, call with company_slug=...")

        company_data = query_graph_company(kwargs["company_slug"])

        # Batch processing should use Ahmed as the user since it will make everything easier
        # In the past we had to handle this NULL by using a constant of my user_id every where
        ahmed_user = AuthenticatedUser(
            id="5d8fd6f3-b5d9-42fd-a04a-7ecaa8883aa1",
            email="ahmed@narrator.ai",
            tags=UserTags(favorite=None, recently_viewed=None),
            is_internal_admin=True,
            is_admin=True,
            company=UserCompany(
                id=company_data.id,
                slug=company_data.slug,
                name=company_data.name,
                everyone_team_id=next((t.id for t in company_data.teams if t.name == "Everyone"), None),
                auth0_org_id="",
            ),
        )

        company = Company(**company_data.dict(), current_user=ahmed_user)
        mavis = Mavis(company=company)
        mavis.set_message_id(kwargs.get("message_id"))

        thread_id = threading.get_native_id()
        set_contextvars(company_slug=company.slug, thread_id=thread_id)
        set_current_span_attributes(company_slug=company.slug, thread_id=str(thread_id))

        try:
            return fn(mavis, *args, **kwargs)
        finally:
            # Remove S3 session from memory. See https://github.com/boto/boto3/issues/1670.
            del company.s3
            gc.collect()

    return wrapper
