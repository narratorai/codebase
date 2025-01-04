
// Given basic warehouse data provides an implementation of
// IWarehouseSource

// IWarehouseSource is what SqlCompletionService uses to get its data

import { IFunctionSnippet, ITableSchema, IWarehouseData, IWarehouseSource } from "./SqlAutocompleteInterfaces";


export default class WarehouseSource implements IWarehouseSource {
  private _schemaData: string[] = []
  private _warehouseData: IWarehouseData = {}
  private _shortSchemaWarehouseData: IWarehouseData = {}
  private _functions: IFunctionSnippet[] = []

  setSchemas = (schemaData: string[]) => {
    this._schemaData = schemaData
  }

  setWarehouseData = (warehouseData: IWarehouseData) => {
    this._buildWarehouseData(warehouseData)
  }

  setFunctions = (functions: IFunctionSnippet[]) => {
    this._functions = functions
  }

  getSchemas = (): string[] => {
    if (this._schemaData) {
      return this._schemaData
    }

    return []
  }

  getTables = (schemaName: string): string[] => {
    const tables = this._getTablesInSchema(schemaName)
    return tables.map((table) => table.table_name)
  }

  getColumns = (schemaName: string, tableName: string): string[] => {
    const tables = this._getTablesInSchema(schemaName)
    const table = tables.find((entry) => entry.table_name.toLowerCase() === tableName.toLowerCase())
    if (table) {
      return table.columns
    }
    return []
  }

  getFunctions = (): IFunctionSnippet[] => {
    if (this._functions) {
      return this._functions
    }

    return []
  }

  _getTablesInSchema = (schemaName: string): ITableSchema[] => {
    let tables = undefined
    if (this._warehouseData) {
      tables = this._warehouseData[schemaName.toLowerCase()]

      if (!tables) {
        // Sometimes a schema name registered by the warehouse schema is of the form
        // database.schema (i.e. Snowflake).
        // In that scenario, it's *optional* to specify the 'database.' part
        tables = this._shortSchemaWarehouseData[schemaName.toLowerCase()]
      }
    }

    return tables || []
  }

  _buildWarehouseData(warehouseData: IWarehouseData) {
    // Creates a mapping of schema name to table data for when
    // the normal _warehouseData contains schema names with
    // '.' in the middle
    //
    // We have no way of knowing *which* database is in the current context
    // without issuing a query (or something) so we'll only match the
    // partial schema name if it's actually unique.

    const fullSchemaData = {} as IWarehouseData
    const shortSchemaData = {} as IWarehouseData
    for (const key in warehouseData) {
      const tableData = warehouseData[key]
      fullSchemaData[key.toLowerCase()] = tableData

      const dotIndex = key.indexOf('.')
      if (dotIndex > 0) {
        const shortName = key.slice(dotIndex + 1).toLowerCase()

        if (shortSchemaData[shortName]) {
          shortSchemaData[shortName] = []
        } else {
          shortSchemaData[shortName] = tableData
        }
      }
    }

    this._warehouseData = fullSchemaData
    this._shortSchemaWarehouseData = shortSchemaData
  }
}