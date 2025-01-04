from core.api.customer_facing.sql.utils import WarehouseManager
from core.decorators import mutex_task, with_mavis
from core.v4.mavis import Mavis


@mutex_task()
@with_mavis
def grant_missing_access(mavis: Mavis, **kwargs):
    """
    Grant access to the warehouse schema
    """
    WarehouseManager(mavis=mavis).sync_schema(async_index=False)
