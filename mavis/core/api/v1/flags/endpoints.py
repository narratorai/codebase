from fastapi import APIRouter, Depends

from core.api.auth import get_mavis
from core.flags import flags_client
from core.v4.mavis import Mavis

router = APIRouter(prefix="/flags", tags=["flags"])


@router.get("")
async def get_flags(mavis: Mavis = Depends(get_mavis)):
    """Get all of the user's flags."""
    all_flags = flags_client.all_flags_state(mavis.flags_user)
    return all_flags.to_json_dict()
