from casefy import casefy
from pydantic import BaseModel, Field

from core.models.ids import UUIDStr


class CamelModel(BaseModel):
    class Config:
        alias_generator = casefy.camelcase
        allow_population_by_field_name = True
        orm_mode = True


class PaginationParams(CamelModel):
    page: int = Field(1, ge=1)
    per_page: int = Field(50, ge=1, le=100)


class RangeParam(CamelModel):
    gte: str | None = None
    lte: str | None = None


class SearchParams(PaginationParams):
    search: str | None = None


class SearchParamsWPermissions(SearchParams):
    created_at: RangeParam | None = None
    team_ids: list[str] | None = None
    is_shared_with_everyone: bool | None = None


class FilterParams(SearchParamsWPermissions):
    favorited: bool | None = None


class FilterParamWithUser(FilterParams):
    user_id: UUIDStr | None = None


class FilterParamWithTags(FilterParams):
    tag_ids: list[UUIDStr] | None = None


class FilterParamWithAll(FilterParams):
    tag_ids: list[UUIDStr] | None = None
    user_id: UUIDStr | None = None


class PaginationOutput(CamelModel):
    total_count: int
    page: int
    per_page: int


class TeamPermission(CamelModel):
    id: UUIDStr
    can_edit: bool = False


class ShareInput(CamelModel):
    permissions: list[TeamPermission]
    share_with_everyone: bool = False


class Tags(CamelModel):
    tags: list[UUIDStr]


class CompanyTag(CamelModel):
    tag: str
    user_id: UUIDStr | None
    color: str | None


class BasicObject(CamelModel):
    id: UUIDStr


class GraphTask(CamelModel):
    id: UUIDStr
    label: str
    schedule: str


class FullTag(CamelModel):
    id: UUIDStr
    updated_at: str
    tag_id: UUIDStr
    company_tag: CompanyTag


class Version(CamelModel):
    id: UUIDStr
    created_at: str
    user_id: UUIDStr
    s3_key: str


class Alert(CamelModel):
    id: UUIDStr
    kind: str
    started_at: str
    notes: str | None = None


class TagOutput(CamelModel):
    id: UUIDStr
    updated_at: str


class NodePlotConfig(CamelModel):
    slug: str


class NodeColumnConfig(CamelModel):
    id: str


class NodeTabConfig(CamelModel):
    slug: str
    plot: NodePlotConfig | None = None
    column: NodeColumnConfig | None = None


class NodeDatasetConfig(CamelModel):
    id: str
    tab: NodeTabConfig


class OutputModelNoName(CamelModel):
    id: UUIDStr
    created_at: str
    created_by: UUIDStr | None
    favorited: bool = False
    total_favorites: int = 0
    team_ids: list[UUIDStr] = Field(default_factory=list)
    tag_ids: list[UUIDStr] = Field(default_factory=list)
    shared_with_everyone: bool = False


class OutputModel(OutputModelNoName):
    name: str


class OutputModelWithViews(OutputModel):
    last_viewed_at: str | None
    last_viewed_by_anyone_at: str | None
    total_user_views: int = 0


OUTPUT_MODEL_EXAMPLE = {
    "id": "3b0daaa9-e7bf-4e62-9c5e-392cb193036d",
    "name": "Name of Object",
    "slug": "slug_of_object",
    "created_at": "2021-10-01T00:00:00Z",
    "team_ids": ["db0daaa9-e7bf-4e62-9c5e-392cb193036d"],
    "favorited": True,
    "tag_ids": ["db0daaa9-e7bf-4e62-9c5e-392cb193036d"],
}

OUTPUT_MODEL_EXAMPLE_WITH_VIEWS = {
    **OUTPUT_MODEL_EXAMPLE,
    "lastViewedAt": "2021-10-01T00:00:00Z",
}
