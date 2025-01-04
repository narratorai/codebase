from enum import StrEnum

from core.models.ids import UUIDStr

from ..utils.pydantic import (
    CamelModel,
    FilterParamWithAll,
)


class TrainingTypeEnum(StrEnum):
    config = "config"
    computed = "computed"
    custom = "custom"


class QueryParams(FilterParamWithAll):
    kind: TrainingTypeEnum | None = None
    dataset_id: UUIDStr | None = None


class TrainingOutput(CamelModel):
    id: UUIDStr
    question: str
    answer: str
    type: TrainingTypeEnum


class GetTrainingOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[TrainingOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "question": "What is the MRR?",
                            "answer": "MRR is the sum of all recurring revenue for a company.",
                            "type": "config",
                        }
                    ],
                }
            ]
        }
