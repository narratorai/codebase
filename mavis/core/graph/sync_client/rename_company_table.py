from typing import Any, List, Optional

from .base_model import BaseModel


class RenameCompanyTable(BaseModel):
    update_company_table: Optional["RenameCompanyTableUpdateCompanyTable"]
    update_company_by_pk: Optional["RenameCompanyTableUpdateCompanyByPk"]
    update_transformation: Optional["RenameCompanyTableUpdateTransformation"]


class RenameCompanyTableUpdateCompanyTable(BaseModel):
    returning: List["RenameCompanyTableUpdateCompanyTableReturning"]


class RenameCompanyTableUpdateCompanyTableReturning(BaseModel):
    id: Any


class RenameCompanyTableUpdateCompanyByPk(BaseModel):
    slug: str


class RenameCompanyTableUpdateTransformation(BaseModel):
    returning: List["RenameCompanyTableUpdateTransformationReturning"]


class RenameCompanyTableUpdateTransformationReturning(BaseModel):
    name: Optional[str]
    id: Any


RenameCompanyTable.update_forward_refs()
RenameCompanyTableUpdateCompanyTable.update_forward_refs()
RenameCompanyTableUpdateCompanyTableReturning.update_forward_refs()
RenameCompanyTableUpdateCompanyByPk.update_forward_refs()
RenameCompanyTableUpdateTransformation.update_forward_refs()
RenameCompanyTableUpdateTransformationReturning.update_forward_refs()
