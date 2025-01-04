from pydantic import BaseModel


class CustomerJourneyInput(BaseModel):
    customer: str
    use_anonymous_id: bool = False

    # for the UI
    offset: int | None
    limit: int = 2000
    desc: bool = True
    run_live: bool = False


class JourneyFound(BaseModel):
    customer_display_name: str | None
    customer: str


class SearchOutput(BaseModel):
    customer_options: list[JourneyFound]


class EachAttribute(BaseModel):
    name: str
    value: str | None


class JourneyRow(BaseModel):
    id: str
    ts: str
    activity: str
    attributes: list[EachAttribute]
    occurrence: int
    revenue: float | None
    link: str | None


class JourneyOutput(BaseModel):
    events: list[JourneyRow] = []
    is_done: bool


class JourneyAttribute(BaseModel):
    attributes: list[EachAttribute]
    null_attributes: list[str]


class JourneyFoundForActivity(JourneyFound):
    occurrence: str | None
    ts: str | None


class ActivityJourneyOutput(BaseModel):
    examples_found: list[JourneyFoundForActivity]
