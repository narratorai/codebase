from core.graph import graph_client
from core.v4.llm.models import UIMessage, UpdateContext, data_type_enum
from core.v4.llm.tools import Tool


class UpdateContextTool(Tool):
    @property
    def model(self) -> UpdateContext:
        return UpdateContext

    @property
    def description(self) -> str:
        return "Updates the context of user, company or KPI to keep track of their preferences and specific information"

    @property
    def when_to_use(self) -> str:
        return "Whenever the user provides new information (such as KPIs, company details, or preferences) that differs from or adds to the initial context provided in the first message, use this tool to update and combine the new data with the existing context for more accurate future interactions."

    def run(self, model: UpdateContext) -> UIMessage:
        graph_client.update_user_context(
            company_id=self.mavis.company.id,
            user_id=self.mavis.user.id,
            context_update=model.context,
        )
        return UIMessage(
            data_type_enum=data_type_enum.update_context,
            data=model,
        )
