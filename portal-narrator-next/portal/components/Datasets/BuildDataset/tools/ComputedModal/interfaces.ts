export interface ComputedColumnKind {
  kind: string
  label: string
  description: string
  sql: string
  valueType: string
  columnType: string
  example: string
  exampleTable: {
    columns: {
      accessor: string
      label: string
      type: string
    }[]
    rows: any[]
  }
}
