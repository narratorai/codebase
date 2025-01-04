"""This is the admin-only version of `block.py`."""

# TODO move constants out
# TODO flush out input and output models

from enum import Enum

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core.api.auth import get_mavis
from core.api.v1.endpoints.block import (
    _get_data,
    _get_values,
    _run_block,
    _update_schema,
)
from core.constants import PRODUCTION_BLOCKS, PROTOTYPE_BLOCKS, REDIRECT_ADMIN_BLOCKS
from core.errors import ForbiddenError
from core.graph import graph_client
from core.logger import get_logger
from core.v4.block import Block
from core.v4.mavis import Mavis

router = APIRouter(prefix="/block", tags=["admin", "block"])
logger = get_logger()


# Generate a key mirror enum for all block slugs
BlocksEnum: Enum = Enum(
    value="Blocks",
    names=[(b, b) for b in list(set(PRODUCTION_BLOCKS + REDIRECT_ADMIN_BLOCKS + PROTOTYPE_BLOCKS))],
)


class BlockDescription(BaseModel):
    slug: str
    version: int
    title: str
    description: str


class ListBlocksOutput(BaseModel):
    blocks: list[BlockDescription]
    failed_blocks: list[str]


class IndexBlocksOutput(BaseModel):
    blocks: list[BlockDescription] = None


class RunBlockInput(BaseModel):
    data: dict | None  # TODO BlockInputData type


# TODO type me!
class RunBlockOutput(BaseModel):
    pass


class UpdateBlockStateInput(BaseModel):
    data: dict  # TODO UpdateBlockStateData type


# TODO type me
class UpdateBlockStateOutput(BaseModel):
    pass


class UpdateBlockSchemaInput(BaseModel):
    data: dict | None  # TODO UpdateBlockStateData type
    internal_cache: dict | None  # TODO UpdateBlockStateInternalCache type


# TODO type me
class UpdateBlockSchemaOutput(BaseModel):
    pass


class ProcessBlockInput(BaseModel):
    data: dict | None  # TODO UpdateBlockStateData type
    field_slug: str | None


# TODO type me
class ProcessBlockOutput(BaseModel):
    pass


def _can_use_prototype(mavis, block_slug):
    if block_slug in PRODUCTION_BLOCKS + REDIRECT_ADMIN_BLOCKS:
        return True
    elif mavis.user.is_internal_admin:
        return True
    else:
        return block_slug in _get_allowed_blocks(mavis)


def _get_allowed_blocks(mavis, include_production=True):
    # check if the user is a super admin: allow all
    if mavis.user.is_internal_admin:
        return [k.value for k in BlocksEnum]

    company_allowed_prototypes = [
        b.block_slug for b in graph_client.get_allowed_prototypes(company_id=mavis.company.id).company_prototypes
    ]

    all_blocks = [slug for slug in company_allowed_prototypes if slug in PROTOTYPE_BLOCKS]

    if include_production:
        all_blocks.extend(PRODUCTION_BLOCKS)

    return list(set(all_blocks))


@router.get("", response_model=IndexBlocksOutput)
async def admin_list_blocks(mavis: Mavis = Depends(get_mavis)):
    blocks = _get_block(mavis, _get_allowed_blocks(mavis, include_production=False))
    return dict(blocks=sorted(blocks, key=lambda b: b["title"]))


@router.get("/index", response_model=IndexBlocksOutput)
async def admin_index_blocks(mavis: Mavis = Depends(get_mavis)):
    production_blocks = _get_block(mavis, _get_allowed_blocks(mavis, include_production=False))
    return dict(production_blocks=production_blocks)


@router.post("/{slug}")
async def admin_run_block(input: RunBlockInput, slug: BlocksEnum, mavis: Mavis = Depends(get_mavis)):
    # check if the user can access that block
    if not _can_use_prototype(mavis, slug.value):
        raise ForbiddenError("Company does not have access to this prototype")

    return _run_block(input, slug, mavis)


@router.post("/{slug}/schema")
async def admin_update_block_schema(input: UpdateBlockSchemaInput, slug: BlocksEnum, mavis: Mavis = Depends(get_mavis)):
    # check if the user can access that block
    if not _can_use_prototype(mavis, slug.value):
        raise ForbiddenError("Company does not have access to this prototype")

    return _update_schema(input, slug, mavis)


@router.post("/{slug}/process")
async def admin_process_block_data(input: ProcessBlockInput, slug: BlocksEnum, mavis: Mavis = Depends(get_mavis)):
    # check if the user can access that block
    if not _can_use_prototype(mavis, slug.value):
        raise ForbiddenError("Company does not have access to this prototype")

    block = _get_data(mavis, slug, input)

    if block.is_async:
        return await block.async_process_data(updated_field_slug=input.field_slug)
    else:
        return block.process_data(updated_field_slug=input.field_slug)


@router.post("/{slug}/values")
async def admin_get_block_values(input: ProcessBlockInput, slug: BlocksEnum, mavis: Mavis = Depends(get_mavis)):
    # check if the user can access that block
    if not _can_use_prototype(mavis, slug.value):
        raise ForbiddenError("Company does not have access to this prototype")

    return _get_values(input, slug, mavis)


def _get_block(mavis, list_slugs):
    all_list = []

    for slug in list_slugs:
        try:
            b = Block(mavis, slug)
            all_list.append(b.title())
        except Exception:
            logger.exception("Failed to list block", slug=slug)

    return all_list
