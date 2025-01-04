from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_status_enum


class GetArchivedCompanies(BaseModel):
    company: List["GetArchivedCompaniesCompany"]


class GetArchivedCompaniesCompany(BaseModel):
    id: Any
    name: Optional[str]
    slug: str
    status: company_status_enum
    resources: Optional["GetArchivedCompaniesCompanyResources"]


class GetArchivedCompaniesCompanyResources(BaseModel):
    id: Any
    company_role: Optional[str]
    kms_key: Optional[str]
    s3_bucket: Optional[str]
    read_policy: Optional[str]
    write_policy: Optional[str]


GetArchivedCompanies.update_forward_refs()
GetArchivedCompaniesCompany.update_forward_refs()
GetArchivedCompaniesCompanyResources.update_forward_refs()
