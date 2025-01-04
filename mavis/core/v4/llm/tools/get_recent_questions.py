from core.graph import graph_client
from core.v4.llm.models import UIMessage, UpdateContext, data_type_enum
from core.v4.llm.tools import Tool


class RecentQuestionsTool(Tool):
    @property
    def model(self) -> UpdateContext:
        return UpdateContext

    @property
    def description(self) -> str:
        return "Gives the last 5 questions asked by the user"

    @property
    def when_to_use(self) -> str:
        return "Whenever the user refers to previous questions (e.g., 'What did I ask yesterday?'), use this tool to retrieve their recent inquiries."

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
