from pydantic import BaseModel, Field


class QueryInputColumns(BaseModel):
    name: str
    filters: str


# TODO express that its sql OR (schema and table)
class RunQueryInput(BaseModel):
    input_fields: dict = Field(None, alias="fields")
    sql: str
    limit: int | None = 1_000


class QueryResult(BaseModel):
    data: dict | None


class DownloadOutput(BaseModel):
    pre_signed_s3_url: str


class DownloadInput(BaseModel):
    s3_path: str


class AutocompleteResult(BaseModel):
    all_functions: list[dict] = []
    all_fields: list[dict] = []
    missing: list[dict] = []
