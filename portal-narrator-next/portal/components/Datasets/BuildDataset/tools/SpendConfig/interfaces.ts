import { ColumnFilterOption } from 'components/Datasets/Explore/interfaces'

type ColumnOption = ColumnFilterOption['column']
export interface ColumnOptionWithId extends ColumnOption {
  id: string
}

export interface SpendJoin {
  column_id: string
  spend_column: string
  apply_computed_logic?: boolean
}

export type TableOption = {
  id: string
  label: string
  schema_name: string
  table_name: string
}

export interface GetSpendOptionsResponse {
  join_columns: ColumnOptionWithId[]
  join_defaults: SpendJoin[]

  metric_options: ColumnOptionWithId[]
  metric_defaults: ColumnOptionWithId[]

  table_options: TableOption[]
  table_default: TableOption
}
