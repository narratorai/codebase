from typing import List, Optional

from .base_model import BaseModel


class GetQueryTemplateSources(BaseModel):
    query_templates: List["GetQueryTemplateSourcesQueryTemplates"]


class GetQueryTemplateSourcesQueryTemplates(BaseModel):
    data_source: str
    schema_names: Optional[str]


GetQueryTemplateSources.update_forward_refs()
GetQueryTemplateSourcesQueryTemplates.update_forward_refs()
