import { IWarehouseSource, IFunctionSnippet, WarehouseSource, IWarehouseData } from '@narratorai/the-sequel'
import { ICompany } from 'graph/generated'
import MavisApiBase from 'util/MavisApiBase'
import { GetToken } from 'util/interfaces'

import { getLogger } from '@/util/logger'
const logger = getLogger()

//
// Manages loading our autocomplete data. It implements
// IWarehouseSource, which TheSequel calls to grab data
// for autocomplete when needed
class FieldsWarehouseSource extends MavisApiBase implements IWarehouseSource {
  private _warehouseSource: WarehouseSource = new WarehouseSource()

  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    super({ getToken, company })
    this._loadSchemas()
    this._loadFunctions()
  }

  // IWarehouseSource API
  getSchemas = this._warehouseSource.getSchemas
  getTables = this._warehouseSource.getTables
  getColumns = this._warehouseSource.getColumns
  getFunctions = this._warehouseSource.getFunctions

  // Implementation
  _loadSchemas = async () => {
    const endpoint = `/v1/query/schema`
    logger.info('Loading warehouse schema')

    try {
      const response = await this._callApi<{ warehouse: IWarehouseData }>({ endpoint })

      this._warehouseSource.setSchemas(Object.keys(response.warehouse))
      this._warehouseSource.setWarehouseData(response.warehouse)
    } catch (err) {
      throw new Error(`Error loading autocomplete schema: ${(err as Error).message}`)
    }
  }

  _loadFunctions = async () => {
    const endpoint = `/v1/query/autocomplete`
    logger.info('Loading sql functions')

    try {
      const response = await this._callApi<{ all_functions: IFunctionSnippet[] }>({ endpoint })
      this._warehouseSource.setFunctions(response.all_functions)
    } catch (err) {
      throw new Error(`Error loading autocomplete functions: ${(err as Error).message}`)
    }
  }
}

export default FieldsWarehouseSource
