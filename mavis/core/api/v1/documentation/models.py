from pydantic import BaseModel


class Documentation(BaseModel):
    slug: str
    markdown: str


class DocumentationOutput(BaseModel):
    all_documents: list[Documentation]
