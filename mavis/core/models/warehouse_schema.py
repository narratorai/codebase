from collections import defaultdict

from pydantic import BaseModel, Field

from core.v4.query_mapping.components import fix_reserved_column


class TableSchemaColumn(BaseModel):
    name: str
    type: str | None
    examples: list[str] | None = None

    def autocomplete_name(self, language: str = None):
        return fix_reserved_column(language, self.name, self.type)

    @property
    def lower_name(self):
        return self.name.lower()

    @property
    def content(self) -> str:
        if self.examples:
            ex = f" (ex. {', '.join(self.examples)})"
        else:
            ex = ""

        return f"{self.name}: {self.type}{ex}"


class TableSchema(BaseModel):
    schema_name: str
    table_name: str
    description: str | None
    total_rows: int | None = None
    indexed_at: str | None = None
    columns: list[TableSchemaColumn] = Field(default_factory=list)
    dim_id: str | None = None
    # when returned from opensearch
    id: str | None = None

    @property
    def name(self) -> str:
        return f"{self.schema_name}.{self.table_name}"

    @property
    def lower_name(self) -> str:
        return self.table_name.lower()

    @property
    def column_names(self) -> list[str]:
        return [col.name for col in self.columns]

    @property
    def lower_column_names(self) -> list[str]:
        return [col.lower_name for col in self.columns]

    @property
    def content(self) -> str:
        return f"{self.schema_name}.{self.table_name} with columns {', '.join([col.content for col in self.columns])}"

    @property
    def unique_id(self) -> str:
        return f"{self.schema_name}.{self.table_name}:{','.join([col.name for col in self.columns])}"


class WarehouseSchema(BaseModel):
    language: str
    tables: list[TableSchema]

    @property
    def schemas(self) -> list[str]:
        return list(set([table.schema_name for table in self.tables]))

    def tables_for(self, schema_name: str) -> list[TableSchema]:
        return [table for table in self.tables if table.schema_name == schema_name]

    def table(self, schema_name: str, table_name: str) -> TableSchema | None:
        return next(
            (t for t in self.tables if t.schema_name == schema_name and t.table_name == table_name),
            None,
        )

    def columns(self, schema_name, table_name) -> list[TableSchemaColumn]:
        return next(
            [
                table.columns
                for table in self.tables
                if table.schema_name == schema_name and table.table_name == table_name
            ],
            None,
        )

    def column_names(self, schema_name: str, table_name: str, lower: bool = False) -> list[str]:
        if cols := self.columns(schema_name, table_name):
            return [col.lower_name if lower else col.name for col in cols]
        return []

    def for_autocomplete(self) -> dict:
        autcomplete = defaultdict(list)
        for table in self.tables:
            autcomplete[table.schema_name].append(
                dict(
                    table_name=table.table_name,
                    columns=[col.autocomplete_name(self.language) for col in table.columns],
                )
            )
