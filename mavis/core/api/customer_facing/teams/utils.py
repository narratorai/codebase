from core.api.customer_facing.utils.decorator import require_admin
from core.errors import ForbiddenError
from core.graph import graph_client
from core.models.company import query_graph_company
from core.models.ids import UUIDStr

from ..utils.updator import ItemUpdator


class TeamUpdator(ItemUpdator):
    @require_admin
    def fetch_graph_data(self, ids):
        return graph_client.get_team(id=ids[0]).team_by_pk

    def _update(self, id: UUIDStr, name: str | None = None):
        if id == self.user.company.everyone_team_id:
            raise ForbiddenError("You cannot edit the Everyone team")
        graph_client.update_team(id=id, name=name)
        # refresh the cache
        query_graph_company(self.user.company.slug, True)

    @require_admin
    def _create(self, name: str):
        new_id = graph_client.insert_team(company_id=self.user.company.id, name=name).insert_team_one.id
        query_graph_company(self.user.company.slug, True)
        return new_id

    @require_admin
    def _delete(self, id: UUIDStr):
        if id == self.user.company.everyone_team_id:
            raise ForbiddenError("You cannot delete the Everyone team")
        graph_client.delete_team(id=id)
        query_graph_company(self.user.company.slug, True)
