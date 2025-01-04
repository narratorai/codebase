from cachetools import LRUCache, cached
from pydantic import BaseModel

from core.api.customer_facing.activities.utils import ActivitiesQueryBuilder
from core.models.user import AuthenticatedUser
from core.util.llm import text_to_vector
from core.v4.llm.models import ActivityData, UIMessage, data_type_enum
from core.v4.llm.tools import Tool


class RelatedActivities(BaseModel):
    content: str


class GetActivitiesTool(Tool):
    @property
    def model(self) -> RelatedActivities:
        return RelatedActivities

    @property
    def description(self) -> str:
        return "Returns all the activities related to the content. "

    @property
    def when_to_use(self) -> str:
        return 'Whenever the user is looking for an activity (ex. "Do we have any data on [some concept]"). '

    def run(self, model: RelatedActivities) -> UIMessage:
        data = search_activities(self.mavis.user, self.company_table.id, model.content)
        return UIMessage(data_type_enum=data_type_enum.activity_data, data=data)


@cached(cache=LRUCache(maxsize=60), key=lambda _, table_id, content: (table_id, content))
def search_activities(user: AuthenticatedUser, table_id: str, content: str) -> ActivityData:
    _source = ["id", "slug", "name", "description", "columns"]
    activities = ActivitiesQueryBuilder(user=user, table_id=table_id).semantic_search(
        text_to_vector(content), _source=_source
    )
    return ActivityData(activities=[a["_source"] for a in activities])
