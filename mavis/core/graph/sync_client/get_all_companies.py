from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import datacenter_region_enum


class GetAllCompanies(BaseModel):
    company: List["GetAllCompaniesCompany"]


class GetAllCompaniesCompany(BaseModel):
    id: Any
    name: Optional[str]
    slug: str
    datacenter_region: Optional[datacenter_region_enum]


GetAllCompanies.update_forward_refs()
GetAllCompaniesCompany.update_forward_refs()
