from core import utils
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import datacenter_region_enum
from core.v4.mavis import Mavis


@mutex_task()
@with_mavis
def get_active_companies(mavis: Mavis, **kwargs):
    comps = graph_client.get_all_companies().company
    utils.cprint(
        "ACTIVE_US_COMPANIES=({})".format(
            " ".join(c.slug for c in comps if c.datacenter_region == datacenter_region_enum.US)
        )
    )
    utils.cprint(
        "ACTIVE_EU_COMPANIES=({})".format(
            " ".join(c.slug for c in comps if c.datacenter_region == datacenter_region_enum.EU)
        )
    )
