from pydantic import BaseModel

from core.v4.llm.models import QuestionRecommendation, UIMessage
from core.v4.llm.tools import Tool


class GetQuestionRecommendation(BaseModel):
    summary_of_conversation: str


class QuestionRecommenderTool(Tool):
    @property
    def model(self) -> GetQuestionRecommendation:
        return GetQuestionRecommendation

    @property
    def description(self) -> str:
        return "Returns a list of questions that the user might ask next. "

    @property
    def when_to_use(self) -> str:
        return "Whenever the user seems unsure about their query or could benefit from further exploration, use this tool to suggest the next best question for them to answer."

    def run(self, model: GetQuestionRecommendation) -> UIMessage:
        next_skill = self.get_next_skill()

        # Get a list of questions for the skill

        # ask chat gpt to come up with a question similar to the above questions but related to the conversation

        # return the questions
        return QuestionRecommendation(question=["What is the next skill I should learn?"], skill=next_skill)

    def get_next_skill(self):
        return ""
