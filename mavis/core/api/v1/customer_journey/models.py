from enum import Enum

from pydantic import BaseModel

CustomerKindEnum = Enum(
    value="CustomerKinds",
    names=[(b.upper(), b) for b in ("customer", "join_customer", "source_id", "anonymous_customer_id")],
)

TimestampKindEnum = Enum(value="CustomerKinds", names=[(b.upper(), b) for b in ("around", "before", "after")])

DEFAULT_CUSTOMER_KIND = ("customer", "join_customer", "anonymous_customer_id")


class CustomerJourneyInput(BaseModel):
    table: str | None
    customer: str | None
    filters: list[dict] = []  # TODO: add filter object
    offset: int | None
    limit: int = 500
    run_live: bool = False


class CustomerStreamInput(BaseModel):
    table: str | None = None
    customer: str | None = None
    customer_kind: str = "customer"
    activities: list[str] = []
    hide_activities: bool = False
    start_activity: str | None = None
    end_activity: str | None = None
    only_first_occurrence = False
    timestamp: str | None
    time_filter: dict | None
    limit: int = 1000
    offset: int = 0
    asc: bool = False
    run_live: bool = False
    depth: int = 10
    time_between: int = 1
    time_between_resolution = "second"


class CustomerJourneyResults(BaseModel):
    plot: dict | None = None
    data: dict | None = None
    go_to_row_id: int | None = None
    customer: str | None = None
    customer_kind: str = "customer"
    table: str | None = None
    asc: bool = False
    retrieved_at: str | None = None
    show_customer: bool = False


class CustomerKinds(BaseModel):
    id: str
    label: str


class AutoCompleteResults(BaseModel):
    customers: list[str]
