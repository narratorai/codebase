from core.decorators import with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.logger import get_logger
from core.v4.mavis import Mavis

logger = get_logger()


@with_mavis
def update_company_teams(mavis: Mavis, **kwargs):
    """
    Gets the path of the company
    """

    all_comps = graph_client.get_all_companies().company

    for c in all_comps:
        everyone_id = graph_client.insert_team(c.id, "Everyone").insert_team_one.id

        # Add all the users
        all_users = graph_client.get_company_users(c.id).company_user

        for u in all_users:
            graph_client.insert_user_team(u.id, everyone_id)

            # add all the value
            for v in access_role_enum:
                graph_client.insert_user_role(company_user_id=u.id, role=v.value)
