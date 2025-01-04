from fastapi import APIRouter, Depends

from core.api.auth import get_mavis
from core.models.ids import UUIDStr
from core.v4.block import Block
from core.v4.mavis import Mavis

from .models import ActivityResult

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/{activity_id}", response_model=ActivityResult)
async def get_activity(activity_id: UUIDStr, mavis: Mavis = Depends(get_mavis)):
    """Return the block the transformation."""
    data = dict(id=activity_id)
    block_slug = "activity_context_v2"
    block = Block(mavis, block_slug, data)
    block.process_data(updated_field_slug="root_id")
    res = block.update_schema()

    return dict(**res, block_slug=block_slug)


@router.get("/stream/{table_id}", response_model=ActivityResult)
async def get_stream(table_id: str, mavis: Mavis = Depends(get_mavis)):
    """Return the block the transformation."""
    data = dict(id=table_id)
    block_slug = "stream_context"
    block = Block(mavis, block_slug, data)
    block.process_data(updated_field_slug="root_id")
    res = block.update_schema()

    return dict(**res, block_slug=block_slug)


@router.get("/dim/{dim_id}", response_model=ActivityResult)
async def get_dim(
    dim_id: UUIDStr,
    mavis: Mavis = Depends(get_mavis),
):
    """Return the block the transformation."""
    data = dict(id=dim_id)
    block_slug = "dim_context"
    block = Block(mavis, block_slug, data)
    block.process_data(updated_field_slug="root_id")
    res = block.update_schema()

    return dict(**res, block_slug=block_slug)
