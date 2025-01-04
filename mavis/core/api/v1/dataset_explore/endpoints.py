from fastapi import APIRouter, Depends

from core.api.auth import get_current_user
from core.errors import SilenceError

# from core.models.ids import get_uuid, remove_enums
from core.models.user import AuthenticatedUser

# from .helpers import (
#     _get_dataset_obj,
#     apply_explore_options,
#     get_explore_options,
#     make_definition,
# )
# from .models import (
#     ApplyExploreColumnsInput,
#     ApplyExploreColumnsOutput,
#     CacheOutput,
#     ExploreColumnsInput,
#     ExploreColumnsOutput,
# )

router = APIRouter(prefix="/dataset/explore", tags=["dataset"])


@router.post("/options")
@router.post("/get_explore_options")
async def create_explore_options(
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Create the proper explore
    """
    raise SilenceError("This feature is currently deprecated. ")
    # # create it since it need to be opened up for Portal
    # dataset_definition = make_definition(input)

    # try:
    #     return_dict = get_explore_options(mavis, input.dataset_config, dataset_definition)
    #     return_dict.update(return_dict["dataset_definition"].items())
    # except Exception as e:
    #     raise SilenceError(
    #         "Explore capabilities are not supported for for datasets with aggregate columns or time-based cohorts. Please visit the underlying dataset to segment and explore this data."
    #     ) from e

    # return return_dict


@router.post("/share")
@router.post("/get_share_explore")
async def create_share_explore(
    user: AuthenticatedUser = Depends(get_current_user),
):
    raise SilenceError("This feature is currently deprecated. ")
    # cache_id = get_uuid()
    # file = remove_enums(input.dict())
    # mavis.upload_object(file, ["explore", cache_id + ".json"])
    # fivetran_track(mavis.user, data=dict(action="shared_explore"))

    # return dict(slug=cache_id)


@router.get(
    "/share/{cache_id}",
)
@router.get(
    "/load_share_explore",
)
async def get_share_explore(
    user: AuthenticatedUser = Depends(get_current_user),
):
    raise SilenceError("This feature is currently deprecated. ")
    # res = mavis.get_file(["explore", f"{cache_id}.json"])
    # fivetran_track(mavis.user, data=dict(action="loaded_shared_explore"))
    # return res


@router.post("/apply")
@router.post("/apply_explore")
async def create_apply_explore_options(
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Create the proper explore
    """
    raise SilenceError("This feature is currently deprecated. ")
    # dataset_definition = make_definition(input)

    # (d_obj, _, _, dataset_definition) = _get_dataset_obj(
    #     mavis, input.dataset_config, dataset_definition
    # )

    # return_dict = apply_explore_options(
    #     mavis,
    #     d_obj,
    #     input.plot_kind,
    #     input.y_metrics,
    #     input.segment_bys,
    #     input.time_resolution,
    #     input.selected_filters,
    #     input.time_filter,
    #     input.output_kind,
    # )

    # return_dict.update(dataset_definition.items())
    # fivetran_track(mavis.user, data=dict(action="ran_explore"))
    # return return_dict
