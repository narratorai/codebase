import { ICompany } from 'graph/generated'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

//
// Base class for classes that want to call Mavis API
//

type httpMethod = 'GET' | 'POST' | 'DELETE'
type ParamsProps = { [key: string]: string | boolean | number | undefined }

abstract class MavisApiBase {
  private _company: ICompany
  private _getToken: GetToken

  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    this._company = company
    this._getToken = getToken
  }

  protected async _post<R>({
    endpoint,
    body,
    autoRetry = false,
  }: {
    endpoint: string
    body: unknown
    autoRetry?: boolean
  }): Promise<R> {
    return this._callApi<R>({ endpoint, body, method: 'POST', autoRetry })
  }

  protected async _get<R>({ endpoint, params }: { endpoint: string; params?: ParamsProps }): Promise<R> {
    return this._callApi<R>({ endpoint, method: 'GET', params })
  }

  protected async _delete<R>({
    endpoint,
    body,
    params,
  }: {
    endpoint: string
    body: unknown
    params?: ParamsProps
  }): Promise<R> {
    return this._callApi<R>({ endpoint, body, params, method: 'DELETE' })
  }

  protected async _callApi<R>({
    endpoint,
    params,
    method = 'GET',
    body,
    autoRetry = false,
    asCsv = false,
  }: {
    endpoint: string
    params?: ParamsProps
    method?: httpMethod
    body?: unknown
    autoRetry?: boolean
    asCsv?: boolean
  }): Promise<R> {
    return await mavisRequest<R>({
      method,
      getToken: this._getToken,
      path: endpoint,
      params: {
        ...(params || {}),
        company: this._company.slug,
      },
      retryable: autoRetry,
      textResponse: asCsv,
      body: body ? JSON.stringify(body) : undefined,
      company: this._company,
    })
  }
}

export default MavisApiBase
