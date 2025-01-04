from pydantic import BaseModel


class Mapping(BaseModel):
    schema_name: str
    data_source: str


class QueryTemplateSources(BaseModel):
    data_sources: list[str]
    schemas: list[str]

    mappings: list[Mapping]


class Trans(BaseModel):
    name: str
    kind: str


class OnboardingStarted(BaseModel):
    transformations: list[Trans]
    show_narrative: bool = False


class QueryMapping(BaseModel):
    mappings: list[Mapping]
