export interface IFunctionSnippet {
  description: string
  display_name: string
  documentation?: string
  kind: "operators" | "functions"
  name: string
  output_type: string
  sql: string
}

// Interface to provide the data to autocomplete a warehouse
export interface IWarehouseSource {
  getSchemas : () => string[]
  getTables? : (schema: string) => string[]
  getColumns? : (schema: string, table: string) => string[]
  getFunctions? : () => IFunctionSnippet[]
}

export interface ITableSchema {
  table_name: string
  columns: string[]
}

// Record is a TypeScript type for representing a dictionary.
// Here we expect an object with { 'dw': [], 'segment': [] }, etc
export type IWarehouseData = Record<string, ITableSchema[]>
