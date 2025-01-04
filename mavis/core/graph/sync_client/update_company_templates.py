from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateCompanyTemplates(BaseModel):
    delete_company_narrative_templates: Optional["UpdateCompanyTemplatesDeleteCompanyNarrativeTemplates"]
    insert_company_narrative_templates: Optional["UpdateCompanyTemplatesInsertCompanyNarrativeTemplates"]


class UpdateCompanyTemplatesDeleteCompanyNarrativeTemplates(BaseModel):
    returning: List["UpdateCompanyTemplatesDeleteCompanyNarrativeTemplatesReturning"]


class UpdateCompanyTemplatesDeleteCompanyNarrativeTemplatesReturning(BaseModel):
    id: Any


class UpdateCompanyTemplatesInsertCompanyNarrativeTemplates(BaseModel):
    returning: List["UpdateCompanyTemplatesInsertCompanyNarrativeTemplatesReturning"]


class UpdateCompanyTemplatesInsertCompanyNarrativeTemplatesReturning(BaseModel):
    id: Any


UpdateCompanyTemplates.update_forward_refs()
UpdateCompanyTemplatesDeleteCompanyNarrativeTemplates.update_forward_refs()
UpdateCompanyTemplatesDeleteCompanyNarrativeTemplatesReturning.update_forward_refs()
UpdateCompanyTemplatesInsertCompanyNarrativeTemplates.update_forward_refs()
UpdateCompanyTemplatesInsertCompanyNarrativeTemplatesReturning.update_forward_refs()
