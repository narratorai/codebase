from typing import Any, Optional

from .base_model import BaseModel


class InsertCompanyTable(BaseModel):
    insert_company_table_one: Optional["InsertCompanyTableInsertCompanyTableOne"]


class InsertCompanyTableInsertCompanyTableOne(BaseModel):
    id: Any
    identifier: str
    activity_stream: str
    updated_at: Any


InsertCompanyTable.update_forward_refs()
InsertCompanyTableInsertCompanyTableOne.update_forward_refs()
