import re

from core.models.company import Company
from core.models.ids import UUIDStr
from core.v4.dataset_comp.query.model import (
    DatasetObject,
)


def get_dataset_config(company: Company, id: UUIDStr):
    return company.s3.get_file(["configs", "datasets", f"{id}.json"], cache=True)


def update_dataset_config(company, id: str, config: DatasetObject | dict):
    company.s3.upload_object(
        config.json() if isinstance(config, DatasetObject) else config,
        ["configs", "datasets", f"{id}.json"],
    )


def replace_variable(expression, old_var, new_var):
    # Create a regular expression pattern that matches the exact variable name
    pattern = r"\b" + re.escape(old_var) + r"\b"
    # Replace the old variable with the new one
    new_expression = re.sub(pattern, new_var, expression)
    return new_expression
