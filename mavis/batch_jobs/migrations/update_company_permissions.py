from core.api.customer_facing.utils.pydantic import TeamPermission
from core.api.customer_facing.utils.query import _update_item_permissions
from core.decorators import with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.v4.mavis import Mavis

logger = get_logger()


@with_mavis
def update_company_permissions(mavis: Mavis, **kwargs):
    """
    Gets the path of the company
    """

    all_comps = graph_client.get_all_companies().company

    for c in all_comps:
        print(f"Creating team for {c.name}")

        comp = graph_client.get_company(c.slug).companies[0]
        everyone_id = next((t.id for t in comp.teams if t.name == "Everyone"), None)

        for t in comp.tables:
            _update_item_permissions([TeamPermission(team_id=everyone_id, can_edit=False)], t.id, "table")

        activities = graph_client.activity_index(comp.id).all_activities
        for a in activities:
            _update_item_permissions([TeamPermission(team_id=everyone_id, can_edit=False)], a.id, "activity")
