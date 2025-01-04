"""
Blocks are a core component of the Narrator Portal experience. They are used to produce and process highly dynamic
interfaces and experiences. We use them for prototyping, testing, and to power product features throughout portal.

## SECURITY

Prior incidents:
- [Exposed admin-only functionality to regular users](https://app.shortcut.com/narrator/story/2811/vertical-authorization-bypasses-in-mavis)

This module declares api endpoints for regular users to interact with blocks.

See `admin_blocks.py` for the company admin only version of this module.
"""

# TODO move constants out
# TODO flush out input and output models

from enum import Enum
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from core.api.auth import get_mavis
from core.constants import (
    ADVANCED_FIELD_BLOCKS_V2,
    ADVANCED_NARRATIVE_BLOCKS_V2,
    FIELD_BLOCKS,
    FIELD_BLOCKS_V2,
    NARRATIVE_BLOCKS,
    NARRATIVE_BLOCKS_V2,
    PRODUCTION_BLOCKS,
    REDIRECT_ADMIN_BLOCKS,
    SUPER_ADMIN_NARRATIVE_BLOCKS,
)
from core.logger import get_logger
from core.models.ids import get_uuid
from core.v4.analysisGenerator import _get_default_fields, compile_fields
from core.v4.block import Block
from core.v4.mavis import Mavis

router = APIRouter(prefix="/block", tags=["block"])
logger = get_logger()

ICONS = dict(
    simple_plot="line_chart",
    dataset_table="dataset_icon",
    csv_table="code_outline",
    raw_metric="number_outline",
    narrative_plotter="area_chart",
    analyze_simulator="experiment_outlined",
)

# Generate a key mirror enum for all block slugs
BlocksEnum = Enum(
    value="Blocks",
    names=[
        (b, b)
        for b in list(
            set(
                PRODUCTION_BLOCKS
                + NARRATIVE_BLOCKS
                + FIELD_BLOCKS
                + FIELD_BLOCKS_V2
                + ADVANCED_FIELD_BLOCKS_V2
                + REDIRECT_ADMIN_BLOCKS
                + NARRATIVE_BLOCKS_V2
                + ADVANCED_NARRATIVE_BLOCKS_V2
                + SUPER_ADMIN_NARRATIVE_BLOCKS
            )
        )
    ],
)


def should_redirect_admin_block(redirect_route_name: str):
    """
    Return a FastAPI Dependency configured to redirect to a specific path.

    - Any route using {slug} in this router should inject this dependency and conditionally return its result
    - The redirect_route_name is the exact function name of the route you want to call.
    """

    def _do_redirect(request: Request, slug: str | None = None) -> RedirectResponse | None:
        """
        If the requested block slug is in the redirect list, assemble the URL to the admin version and redirect to it,
        preserving the query and route params.
        """
        if (slug or "").lower() in REDIRECT_ADMIN_BLOCKS:
            redirect_url = request.url_for(redirect_route_name, **request.path_params)
            if request.query_params:
                redirect_url = f"{redirect_url}?{urlencode(request.query_params)}"

            return RedirectResponse(redirect_url)

    return _do_redirect


class BlockDescription(BaseModel):
    slug: str
    version: int
    title: str
    description: str
    icon: str | None
    advanced: bool = False


class ListBlocksOutput(BaseModel):
    blocks: list[BlockDescription]
    failed_blocks: list[str]


class IndexBlocksOutput(BaseModel):
    blocks: list[BlockDescription] = None
    field_blocks: list[BlockDescription]
    narrative_blocks: list[BlockDescription]
    production_blocks: list[BlockDescription]

    field_loading_screen: list[dict] = None
    empty_narrative: dict | None
    empty_dashboard: dict | None


class RunBlockInput(BaseModel):
    data: dict | None  # TODO BlockInputData type


class UpdateBlockSchemaInput(BaseModel):
    data: dict | None  # TODO UpdateBlockStateData type
    internal_cache: dict | None  # TODO UpdateBlockStateInternalCache type


class ProcessBlockInput(BaseModel):
    data: dict | None  # TODO UpdateBlockStateData type
    field_slug: str | None


@router.get("", response_model=IndexBlocksOutput)
async def list_blocks(only_narratives: bool = False, mavis: Mavis = Depends(get_mavis)):
    # add the narrative blocks
    narrative_blocks = _get_block(mavis, NARRATIVE_BLOCKS_V2)
    narrative_blocks.extend([dict(**b, advanced=True) for b in _get_block(mavis, ADVANCED_NARRATIVE_BLOCKS_V2)])

    # add the fields blocks
    field_blocks = _get_block(mavis, FIELD_BLOCKS_V2)
    field_blocks.extend([dict(**b, advanced=True) for b in _get_block(mavis, ADVANCED_FIELD_BLOCKS_V2)])

    # added
    if mavis.user.is_internal_admin or mavis.user.email == "opsnarrator+test.admin@gmail.com":
        narrative_blocks.extend([dict(**b, advanced=True) for b in _get_block(mavis, SUPER_ADMIN_NARRATIVE_BLOCKS)])

    field_loading_screen = [
        dict(
            percent=20,
            text="Processing all the variables",
            duration=11,
        ),
        dict(
            percent=30,
            text="Updating the dataset with the variables",
            duration=20,
        ),
        dict(
            percent=50,
            text="Running the datasets",
            duration=30,
        ),
        dict(
            percent=75,
            text="Assembling the Narrative components",
            duration=42,
        ),
        dict(
            percent=90,
            text="Things are still processing so give it a couple more seconds",
            duration=65,
        ),
    ]
    return dict(
        blocks=_get_block(mavis, NARRATIVE_BLOCKS if only_narratives else PRODUCTION_BLOCKS),
        narrative_blocks=narrative_blocks,
        field_blocks=field_blocks,
        production_blocks=_get_block(mavis, PRODUCTION_BLOCKS),
        field_loading_screen=field_loading_screen,
        empty_narrative=empty_narrative(mavis),
        empty_dashboard=empty_dashboard(mavis),
    )


def empty_narrative(mavis):
    default_field_configs = _get_default_fields(mavis)
    fields, _ = compile_fields(mavis, default_field_configs)

    # wrote it all here: https://portal.narrator.ai/narrator/narratives/edit/test_Z7O5bHA_x
    return dict(
        narrative=dict(
            sections=[
                dict(
                    show=True,
                    title="New Narrative",
                    id=get_uuid(),
                    content=[
                        dict(
                            type="markdown",
                            text='# Welcome to Narratives\n\n\n## Embedding Markdown\nThis editor is a full markdown enabled text editor.\n- Try using some **bold text**\n- or hyper links to [Narrator](https://www.narrator.ai/)\n- or add a divider \n- or add some {color("red500", "colored text")}\n- or maybe a collapse\n    <details>\n    <summary>Hidden Value</summary>\n    1. Some values \n    2. More value\n    </details>\n\n<aside> And a takeway</aside>\n\n\n---------\n\n## Python embedded\nFinally leverage our embedded python via curly brackets \n\nFor example: {3 + 4}\n\n\n## {img_link_w_width("https://images.squarespace-cdn.com/content/v1/5a2861f1d74cff16007d5a71/1602265752971-Q834D91S49HRKURC5BUC/Narrator+Logo.png", 50)} Also you can add images\n\nYou can also use many variables like {#company_name}',
                            id=get_uuid(),
                        )
                    ],
                )
            ],
            key_takeaways=[],
        ),
        field_configs=[],
        datasets=[],
        input_fields=fields,
        questions=None,
    )


def empty_dashboard(mavis):
    # wrote it all here: https://portal.narrator.ai/narrator/narratives/edit/test_Z7O5bHA_x
    return dict(
        narrative=dict(
            sections=[
                dict(
                    show=True,
                    title="New Narrative",
                    id=get_uuid(),
                    content=[
                        dict(
                            type="markdown",
                            text="# Welcome to Dashboards\n\n- Add Text\n- Add Plots\n- etc...",
                            id=get_uuid(),
                        )
                    ],
                )
            ],
            key_takeaways=[],
        ),
        field_configs=[],
        datasets=[],
        questions=None,
    )


@router.get("/index", response_model=IndexBlocksOutput)
async def index_blocks(mavis: Mavis = Depends(get_mavis)):
    return dict(
        narrative_blocks=_get_block(mavis, NARRATIVE_BLOCKS),
        field_blocks=_get_block(mavis, FIELD_BLOCKS),
        production_blocks=_get_block(mavis, PRODUCTION_BLOCKS),
    )


@router.post("/{slug}")
async def run_block(
    input: RunBlockInput,
    slug: BlocksEnum,
    redirect=Depends(should_redirect_admin_block("admin_run_block")),
    mavis: Mavis = Depends(get_mavis),
):
    return redirect if redirect else _run_block(input, slug, mavis)


@router.post("/{slug}/schema")
async def update_block_schema(
    input: UpdateBlockSchemaInput,
    slug: BlocksEnum,
    redirect=Depends(should_redirect_admin_block("admin_update_block_schema")),
    mavis: Mavis = Depends(get_mavis),
):
    return redirect or _update_schema(input, slug, mavis)


@router.post("/{slug}/process")
async def process_block_data(
    input: ProcessBlockInput,
    slug: BlocksEnum,
    redirect=Depends(should_redirect_admin_block("admin_process_block_data")),
    mavis: Mavis = Depends(get_mavis),
):
    if redirect:
        return redirect

    block = _get_data(mavis, slug, input)

    if block.is_async:
        return await block.async_process_data(updated_field_slug=input.field_slug)
    else:
        return block.process_data(updated_field_slug=input.field_slug)


@router.post("/{slug}/values")
async def get_block_values(
    input: ProcessBlockInput,
    slug: BlocksEnum,
    redirect=Depends(should_redirect_admin_block("admin_get_block_values")),
    mavis: Mavis = Depends(get_mavis),
):
    return redirect if redirect else _get_values(input, slug, mavis)


def _get_block(mavis, list_slugs):
    all_list = []
    for slug in list_slugs:
        try:
            b = Block(mavis, slug)
            block_details = b.title()

            # add the icon
            block_details["icon"] = ICONS.get(block_details["slug"])
            # add the list
            all_list.append(block_details)

        except Exception as e:
            logger.error("Failed to list block", slug=slug, exc_info=e)
    return all_list


def _run_block(input: RunBlockInput, slug: BlocksEnum, mavis: Mavis):
    data = input.data or {}
    # add the user info
    data["requester"] = dict(email=mavis.user.email, user_id=mavis.user.id)

    # process the block with the data
    block = Block(mavis, slug.value, data=data)
    return block.run_data()


def _update_schema(input: UpdateBlockSchemaInput, slug: BlocksEnum, mavis: Mavis):
    data = input.data or {}
    data["requester"] = dict(email=mavis.user.email, user_id=mavis.user.id)

    # process the block with the data
    block = Block(mavis, slug.value, data=data)
    return block.update_schema(input.internal_cache)


def _get_data(mavis, slug, input):
    data = input.data or {}
    data["requester"] = dict(email=mavis.user.email, user_id=mavis.user.id)

    # process the block with the data
    block = Block(mavis, slug.value, data=data)
    return block


def _get_values(input: ProcessBlockInput, slug: BlocksEnum, mavis: Mavis = Depends(get_mavis)):
    data = input.data or {}
    data["requester"] = dict(email=mavis.user.email, user_id=mavis.user.id)

    # process the block with the data
    block = Block(mavis, slug.value, data=data)
    return block.get_values(updated_field_slug=input.field_slug)
