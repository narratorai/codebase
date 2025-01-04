# TODO create core.models.dataset (v4?) for the output models

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from core.api.auth import get_mavis
from core.api.customer_facing.transformations.utils import TransformationManager
from core.models.ids import UUIDStr
from core.v4.block import Block
from core.v4.mavis import Mavis

router = APIRouter(prefix="/transformation", tags=["admin", "transformation"])


class TransformationResult(BaseModel):
    data_schema: dict | list = Field(..., alias="schema")
    ui_schema: dict
    data: dict | list
    internal_cache: dict
    block_slug: str


class DeleteResults(BaseModel):
    actions: list[str]


@router.get("/{transformation_id}", response_model=TransformationResult)
async def admin_get_transformation(transformation_id: UUIDStr, mavis: Mavis = Depends(get_mavis)):
    """Get the transformation."""
    data = dict(
        current_script=dict(id=transformation_id),
    )
    block_slug = "transformation_context_v2"

    block = Block(mavis, block_slug, data)
    block.process_data(updated_field_slug="root_current_script_id")
    res = block.update_schema()

    return dict(**res, block_slug=block_slug)


@router.delete("/{transformation_id}", status_code=200, response_model=DeleteResults)
async def admin_delete_transformation(transformation_id: UUIDStr, mavis: Mavis = Depends(get_mavis)):
    """Delete the transformation."""
    return _delete_transformation(mavis, transformation_id)


def _delete_transformation(mavis: Mavis, transformation_id: UUIDStr):
    TransformationManager(mavis=mavis).delete(transformation_id)
    return dict(actions=["deleted"])
