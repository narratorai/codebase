from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel, SearchParams


class CustomerJourneyInput(CamelModel):
    customer: str
    use_anonymous_id: bool = False

    # for the UI
    offset: int | None
    limit: int = 2000
    desc: bool = True
    run_live: bool = False


class JourneyFound(CamelModel):
    customer_display_name: str | None
    customer: str


class SearchOutput(CamelModel):
    customer_options: list[JourneyFound]


class EachAttribute(CamelModel):
    name: str
    value: str | None


class JourneyRow(CamelModel):
    id: str
    ts: str
    activity: str
    attributes: list[EachAttribute]
    occurrence: int
    revenue: float | None
    link: str | None


class JourneyEventsOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[JourneyRow]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "1234567890",
                            "ts": "2021-01-01T00:00:00Z",
                            "activity": "page_view",
                            "attributes": [],
                            "occurrence": 1,
                            "revenue": 100.0,
                            "link": "https://www.google.com",
                        },
                        {
                            "id": "1234567890",
                            "ts": "2021-01-01T00:00:00Z",
                            "activity": "page_view",
                            "attributes": [],
                            "occurrence": 1,
                            "revenue": 100.0,
                            "link": "https://www.google.com",
                        },
                    ],
                }
            ]
        }


class JourneyAttribute(CamelModel):
    attributes: list[EachAttribute]
    null_attributes: list[str]


class JourneyFoundForActivity(JourneyFound):
    occurrence: str | None = None
    ts: str | None = None


class QueryParams(SearchParams):
    activity_id: UUIDStr | None = None
    run_live: bool = False


class GetJourneyOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[JourneyFoundForActivity]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "customer": "1234567890",
                            "customer_display_name": "John Doe",
                            "occurrence": 1,
                            "ts": "2021-01-01T00:00:00Z",
                        },
                        {
                            "customer": "1234567890",
                            "customer_display_name": "John Doe",
                            "occurrence": None,
                            "ts": None,
                        },
                    ],
                }
            ]
        }
