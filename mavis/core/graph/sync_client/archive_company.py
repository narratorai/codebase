from typing import Any, List, Optional

from .base_model import BaseModel


class ArchiveCompany(BaseModel):
    update_company_by_pk: Optional["ArchiveCompanyUpdateCompanyByPk"]
    update_service_limit: Optional["ArchiveCompanyUpdateServiceLimit"]


class ArchiveCompanyUpdateCompanyByPk(BaseModel):
    id: Any


class ArchiveCompanyUpdateServiceLimit(BaseModel):
    returning: List["ArchiveCompanyUpdateServiceLimitReturning"]


class ArchiveCompanyUpdateServiceLimitReturning(BaseModel):
    company_id: Any


ArchiveCompany.update_forward_refs()
ArchiveCompanyUpdateCompanyByPk.update_forward_refs()
ArchiveCompanyUpdateServiceLimit.update_forward_refs()
ArchiveCompanyUpdateServiceLimitReturning.update_forward_refs()
