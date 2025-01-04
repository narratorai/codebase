import { ICompany } from 'graph/generated'
import { ISchemas } from './interfaces'
import { mavisRequest, IMavisRequestOptions } from 'util/mavis-api'
import _ from 'lodash'
import { IQueryService, ITableResponse } from '../EditorWithTable'
import { GetToken } from 'util/interfaces'

import { getLogger } from '@/util/logger'
const logger = getLogger()

// Definition of a script; what we save and load
export interface IQueryDefinition {
  query: string
  query_id: number
  updated_at: string
  slug: string
  is_draft: boolean
  is_archived: boolean
  script_params: {
    table: string
    kind: 'customer_attribute' | 'stream'
    update_type: 'regular' | 'materialized_view'
  }
}

//
// This service automatically tracks and cancels previous queries if a new one is run. This makes it easier on clients using it.
// Note this only tracks the most recent query. It's unlikely that we'll run multiple queries and then rerun multiple queries.
// If this is super common use different instances of QueryService
//

class QueryService implements IQueryService {
  private _getToken: GetToken
  private _company: ICompany
  private _companySlug: string
  private _lastRunQuery: string | null
  private _queryAbortController: AbortController

  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    this._getToken = getToken
    this._company = company
    this._companySlug = company.slug as string
    this._lastRunQuery = null
    this._queryAbortController = new AbortController()
  }

  private async callMavis<T = unknown>(opts: Omit<IMavisRequestOptions, 'getToken' | 'company'>) {
    return await mavisRequest<T>({ ...opts, getToken: this._getToken, company: this._company })
  }

  getSchemas = async (): Promise<ISchemas> => {
    let response = null

    try {
      response = await this.callMavis<any>({
        path: '/v1/query/schema',
        params: {
          company: this._companySlug,
        },
      })
    } catch (err) {
      throw new Error(`Error getting schemas: ${(err as Error).message}`)
    }
    return response.warehouse
  }

  runQuery = async (
    sql: string,
    asAdmin = false,
    asCsv = false,
    runLive = false,
    fields?: { current_script: string }
  ): Promise<ITableResponse> => {
    let response = null
    sql = _.trim(sql)

    if (!this._lastRunQuery) {
      this._lastRunQuery = sql
    } else if (this._lastRunQuery !== sql) {
      // a previous query is currently running and we just got called with a new one
      // cancel the previous query before running the new one
      try {
        await this.cancelQuery(this._lastRunQuery)
      } catch (err) {
        // don't rethrow. we can still succesfully run the query if cancel didn't work
      }

      this._lastRunQuery = sql
    }

    const body: { sql: string; fields?: { current_script: string } } = { sql }
    if (fields) {
      body['fields'] = fields
    }

    try {
      logger.debug({ sql }, 'Running query')
      response = await this.callMavis<any>({
        method: 'POST',
        path: asAdmin ? '/admin/v1/query/run' : '/v1/query/run',
        params: {
          company: this._companySlug,
          // No CSV download for admin mode
          as_csv: !asAdmin && asCsv,
          run_live: runLive === true ? 'true' : 'false',
        },
        body: JSON.stringify(body),
        retryable: true,
        textResponse: asCsv,
        opts: {
          signal: this._queryAbortController.signal,
        },
      })
    } catch (err: any) {
      const errResponse = err?.response

      const description = errResponse?.description || 'Error running query'
      const message = errResponse?.message

      if (message) {
        throw new Error(`${description}: ${message}`)
      }

      // fallback to showing a generic error message
      throw new Error(description)
    }

    this._lastRunQuery = null

    if (response && asCsv) {
      return response
    }

    if (response.data) {
      const columns = response.data.columns.map((column: any) => column.name)
      return { rows: response.data.rows, columns: columns, retrievedAt: response.data.retrieved_at }
    }

    return { rows: [], columns: [] }
  }

  cancelQuery = async (sql: string): Promise<void> => {
    // cancel the run query request
    this._queryAbortController.abort()
    // Reset abort controller
    this._queryAbortController = new AbortController()

    // same api as run with cancel set to true
    logger.debug({ sql }, 'Canceling query')

    const body = { sql }

    try {
      await this.callMavis({
        method: 'POST',
        path: '/v1/query/run',
        params: {
          company: this._companySlug,
          cancel: true,
        },
        body: JSON.stringify(body),
      })
    } catch (err: any) {
      logger.error({ err }, 'Error canceling query')
      const errResponse = err?.response
      const description = errResponse?.description || 'Error canceling query'
      const message = errResponse?.message

      if (message) {
        throw new Error(`${description}: ${message}`)
      }

      // fallback to showing a generic error message
      throw new Error(description)
    }
  }

  loadQuery = async (queryId: number): Promise<IQueryDefinition> => {
    let response

    try {
      response = await this.callMavis<IQueryDefinition>({
        path: `/v1/query/${queryId}`,
        params: {
          company: this._companySlug,
        },
      })
    } catch (err) {
      throw new Error(`Error loading query: ${(err as Error).message}`)
    }

    return response
  }

  saveQuery = async (query: IQueryDefinition): Promise<IQueryDefinition> => {
    let response
    const queryId = query.query_id
    logger.info({ queryId }, `Saving query`)

    try {
      response = await this.callMavis<IQueryDefinition>({
        method: 'POST',
        path: `/v1/query/${queryId}`,
        params: {
          company: this._companySlug,
        },
        body: JSON.stringify(query),
      })
    } catch (err) {
      throw new Error(`Error saving query: ${(err as Error).message}`)
    }

    return response
  }
}

export default QueryService
