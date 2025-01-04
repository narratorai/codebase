from pydantic import BaseModel

from core.v4.llm.models import UIMessage
from core.v4.llm.tools import Tool


class GetUIFeatures(BaseModel):
    summary_of_conversation: str


class UIFeaturesTool(Tool):
    @property
    def model(self) -> GetUIFeatures:
        return GetUIFeatures

    @property
    def description(self) -> str:
        return "Returns a list of UI features that the user might find useful based on their query."

    @property
    def when_to_use(self) -> str:
        return "If the user asks about the user interface (UI) or the options available in the product (e.g., buttons, features), use this tool to retrieve relevant UI elements."

    def run(self, model: GetUIFeatures) -> UIMessage:
        # Get a list of UI features based on the conversation summary

        # ask chat gpt to come up with UI features related to the conversation

        # return the UI features
        return None
