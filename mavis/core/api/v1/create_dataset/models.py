from pydantic import BaseModel

from core.v4 import createDataset


class DatasetInputColumns(BaseModel):
    all_columns: list[createDataset.Column]
    default_columns: list[createDataset.Column] = []
    raw_columns: list[createDataset.Column] = []


class DatasetObject(BaseModel):
    dataset: dict


class ColumnShortcut(BaseModel):
    dataset: dict
    group_slug: str | None
    column: dict
    shortcut_key: str
    shortcut_option: str | None


class RowShortcut(BaseModel):
    dataset: dict
    group_slug: str | None
    row: dict
    selected_column_id: str | None
    shortcut_key: str
    shortcut_column_id: str | None


class AllShortcuts(BaseModel):
    column_shortcuts: list[createDataset.ColumnShortcut]
    row_shortcuts: list[createDataset.RowShortcut]


class SpendDetails(BaseModel):
    dataset: dict
    group_slug: str
    joins: list[createDataset.JoinOption] = None
    is_remove: bool = False
    spend_config: createDataset.SpendConfig = None


class SpendInput(BaseModel):
    dataset: dict
    group_slug: str
    table: dict | None


class DatasetDefinitionInput(BaseModel):
    dataset_config: createDataset.DatasetConfig
    dataset: dict | None


class TranslateOutput(BaseModel):
    details: str


class GroupInput(BaseModel):
    dataset: dict
    column_ids: list[str] = []
    time_window: createDataset.TimeWindow = None


class GroupTemplateObject(BaseModel):
    template: str
    columns: list[str]


class SwapGroupInput(BaseModel):
    dataset: dict
    group_slug: str
    column: dict
    new_column_id: str
