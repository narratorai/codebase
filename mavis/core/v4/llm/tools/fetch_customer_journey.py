from typing import Generator, Literal

from pydantic import BaseModel, Field

from core.api.customer_facing.activities.models import BasicActivity
from core.api.customer_facing.journeys.helpers import get_attributes, get_customer_journey, search_customer_table
from core.api.customer_facing.journeys.models import JourneyFound
from core.graph import graph_client
from core.v4.llm.models import CustomerJourneyConfig, JourneyData, UIMessage, data_type_enum, role_enum
from core.v4.llm.tools import Tool
from core.v4.llm.tools.get_related_activities import search_activities


class GetEntityJouney(BaseModel):
    entity: str
    activity_action: Literal["include", "exclude"] | None = None
    activities: list[str] | None = Field(default_factory=list)
    from_time: str | None = None
    to_time: str | None = None


class CustomerJourneyTool(Tool):
    @property
    def model(self) -> GetEntityJouney:
        return GetEntityJouney

    @property
    def description(self) -> str:
        return "Returns all the events an entity.  User can optionally filter using time and activities (include or exclude). "

    @property
    def is_generator(self) -> bool:
        return True

    @property
    def when_to_use(self) -> str:
        return 'This tool provides the journey or events related to the specified entity. Use this when the user inquires about an entity’s lifecycle or activities (e.g., "Show me the journey of [entity name] X"). **NOTE:** If the user does not specify a time range or activities, then all events are returned (this is common user behavior).'

    def apply_json_schema_extra(self, json_schema: dict) -> dict:
        if self.past_messages[-1].role == role_enum.user:
            content = self.past_messages[-1].data.text

            activity_data = search_activities(self.mavis.user, self.company_table.id, content)

            # add the details to the scheam
            activity_schema = json_schema["function"]["parameters"]["properties"]["activities"]
            activity_schema["description"] = (
                "The events to include or exclude from the customer journey. If None, then all events are included"
            )
            activity_schema["items"]["anyOf"] = [
                {"const": activity.slug, "title": activity.name, "description": activity.description}
                for activity in activity_data.activities
            ]
        return json_schema

    def run(self, model: GetEntityJouney) -> Generator:
        activities = graph_client.get_activities_by_slugs(
            table_id=self.company_table.id, slugs=model.activities
        ).activities
        activities = [BasicActivity(**a.dict()) for a in activities]
        config = CustomerJourneyConfig(
            **model.dict(), limit_activities=activities, customer=JourneyFound(customer=model.entity)
        )
        current_message = UIMessage(
            type=data_type_enum.journey,
            data=JourneyData(config=config),
        )
        # update the loading message
        current_message.update_loading(
            10,
            (
                f"Looking up '{model.entity}' in the customer table to find the exact customer..."
                if self.company_table.customer_dim_table_id
                else "Fetching the customer journey for the entity..."
            ),
        )
        yield current_message

        if self.company_table.customer_dim_table_id:
            search_results = search_customer_table(self.mavis, self.company_table.id, config.customer.customer)
            config.customer_options = search_results[:10]
            config.customer = search_results[0]

            current_message.update_loading(
                30,
                f"Found the customer options and now looking up {config.customer.customer_display_name or config.customer.customer}'s attributes...",
            )
            yield current_message

            journey_attributes = get_attributes(self.mavis, self.company_table.id, config.customer)

            current_message.data.attributes = journey_attributes
            current_message.update_loading(50, "Found the attributes, now getting all their events...")
            yield current_message

        current_message.data.journey = get_customer_journey(
            self.mavis,
            self.company_table.id,
            config.customer,
            config.from_time,
            config.to_time,
            config.limit_activities,
        )
        current_message.complete()
        yield current_message
