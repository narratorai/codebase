from pydantic import BaseModel

from core.constants import LLM_AGENT_MODEL
from core.logger import get_logger
from core.util.llm import llm_client
from core.v4.dataset_comp.query.builder import DatasetBuilder
from core.v4.dataset_comp.query.model import ActivitySourceDetails, ComputedDetails, DatasetObject, ParentColumn
from core.v4.dataset_comp.query.util import Dataset
from core.v4.llm.helpers import load_prompt
from core.v4.llm.models import DatasetData, UIMessage
from core.v4.mavis import Mavis

logger = get_logger()


class ComputedColumn(BaseModel):
    name: str
    equation: str


class AdditionalColumns(BaseModel):
    columns: list[ComputedColumn]


def get_column_text(dataset: DatasetObject, columns: list[ParentColumn]) -> list[str]:
    added = set()
    column_text = []
    for a in dataset.activities:
        if a.is_cohort:
            column_text.append(f"- FROM `{a.fetch_type.value}` time a customer did **{a.display_name}** (Is COHORT)")
        else:
            column_text.append(
                f"- FROM `{a.fetch_type.value}` time a customer did **{a.display_name}** `{a.relation.value}` {dataset.cohort_activity.display_name}"
            )

        for c in columns:
            if c.id in added:
                continue

            if isinstance(c.details, ActivitySourceDetails) and c.details.activity_id == a.id:
                added.add(c.id)
                column_text.append(f"   - {c.clean_label} ({c.type})")

    add_additional_columns = False
    for c in columns:
        if c.id not in added:
            if not add_additional_columns:
                column_text.append(" - We then derived the following columns")
                add_additional_columns = True

            # Add the columns that were not added
            column_text.append(f"   - {c.clean_label} ({c.type})")
    return column_text


def check_and_add_dataset_columns(mavis: Mavis, question: str, message: UIMessage) -> UIMessage:
    if not isinstance(message.data, DatasetData):
        raise ValueError("This tool only works with dataset messages")
    dataset = Dataset(mavis, model=message.data.dataset)
    columns = dataset.get_available_columns()

    # Compile the columns text and create user message
    columns_text = get_column_text(dataset.model, columns)
    user_message = f"Question: {question}\nColumns: " + "\n".join(columns_text)

    # Prepare and send request to LLM
    prompt = load_prompt(mavis.company, "computed_columns")
    messages = [
        dict(role="system", content=prompt),
        # TODO: add Few-Shot examples
        dict(role="user", content=user_message),
    ]
    logger.debug("Asking LLM for additional columns", prompt=prompt, user_message=user_message)

    response = llm_client.beta.chat.completions.parse(
        model=LLM_AGENT_MODEL,
        messages=messages,
        response_format=AdditionalColumns,
    )
    response = response.choices[0].message.parsed
    logger.debug("column check responses", res=response.dict())

    # Sort columns by length of clean_label in descending order
    ordered_columns = {
        "dataset": sorted(message.data.dataset.columns, key=lambda x: len(x.clean_label), reverse=True),
        "available": sorted(columns, key=lambda x: len(x.clean_label), reverse=True),
    }

    for c in response.columns:
        for column_type, column_list in ordered_columns.items():
            for oc in column_list:
                if oc.clean_label in c.equation:
                    c.equation = c.equation.replace(oc.clean_label, oc.id)
                    if column_type == "available":
                        message.data.dataset.columns.append(oc)

        # ensure we can compile the column
        qm_col = DatasetBuilder(
            dataset.model,
            mavis.company.table(message.data.dataset.table_id),
            mavis.qm,
        )._parse_obj(c.equation, True)

        message.data.dataset.columns.append(
            ParentColumn(
                label=c.name,
                type=qm_col.get_type(),
                details=ComputedDetails(
                    raw_str=c.equation,
                ),
            )
        )

    return message
