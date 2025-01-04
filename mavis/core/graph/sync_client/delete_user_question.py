from typing import Any, Optional

from .base_model import BaseModel


class DeleteUserQuestion(BaseModel):
    delete_user_training_question_by_pk: Optional["DeleteUserQuestionDeleteUserTrainingQuestionByPk"]


class DeleteUserQuestionDeleteUserTrainingQuestionByPk(BaseModel):
    id: Any


DeleteUserQuestion.update_forward_refs()
DeleteUserQuestionDeleteUserTrainingQuestionByPk.update_forward_refs()
