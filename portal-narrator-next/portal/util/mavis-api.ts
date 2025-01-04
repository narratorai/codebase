import { ICompany, IDatacenter_Region_Enum } from 'graph/generated'
import { isFunction, isNil, isString, pickBy, trimStart } from 'lodash'
import queryString from 'query-string'
import { baseHeaders, retryFetch } from 'util/api'
import { GetToken } from 'util/interfaces'

import { getLogger } from '@/util/logger'

const logger = getLogger()

const localAPI = process.env.NEXT_PUBLIC_LOCAL_MAVIS_URL || 'http://localhost:8000'

// Parse the URL to see if a local_mavis query param is present!
// If so, point at a local mavis-api
// NOTE: value does not matter, if the param is present, we use a local mavis
const entryUrl = new URL(document.location.href)
const useLocalMavis = entryUrl.searchParams.has('local_mavis')

if (useLocalMavis) {
  logger.debug('local_mavis parameter detected: portal will make requests to a local mavis-api')
}

export const getMavisRegionUrl = (company: ICompany) => {
  // Check for European region
  if (company.datacenter_region === IDatacenter_Region_Enum.Eu) {
    return process.env.NEXT_PUBLIC_MAVIS_EU_URL as string
  }

  // default to US region
  return process.env.NEXT_PUBLIC_MAVIS_US_URL as string
}

export interface IMavisErrorDetailsMessage {
  loc?: string[]
  msg?: string
  type?: string
}

export interface IMavisErrorResponse {
  code: string
  type: string
  message?: string | IMavisErrorDetailsMessage[] | undefined
  reason?: string
  description?: string
}

export class MavisApiError extends Error {
  readonly status: number
  readonly response?: IMavisErrorResponse

  constructor(message: string, status: number, response?: IMavisErrorResponse) {
    super(message)
    this.status = status
    this.response = response
  }
}

const parseDetailsMessage = (message: IMavisErrorDetailsMessage[] | undefined) => {
  if (!message) return
  return message.map((messageEntry) => `${messageEntry.msg}: ${messageEntry.loc?.join(', ')}`).join(' || ')
}

// Consistent parsing of mavis-api error responses
// This expects the parsed body of an error response
export const parseErrorMessage = (res: IMavisErrorResponse): string => {
  const code = res?.code
  const message = isString(res?.message) ? res?.message : parseDetailsMessage(res?.message)

  return message || `An unknown error occurred (${code || 'UNKNOWN'})`
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export interface IMavisRequestOptions {
  method?: HttpMethod
  getToken: GetToken
  path: string
  params: {
    company: string
    [key: string]: string | boolean | number | undefined | null
  }
  retryable?: boolean
  textResponse?: boolean
  blobResponse?: boolean
  body?: string | RequestInit['body']
  opts?: Partial<Omit<RequestInit, 'method' | 'headers' | 'body'>>
  preserveFalsyParams?: boolean
  company: ICompany
  contentType?: string
}

export async function mavisRequest<T = Record<string, unknown>>(opts: IMavisRequestOptions): Promise<T> {
  const fetcher = opts.retryable ? retryFetch : fetch

  const mavisApiUrl = useLocalMavis ? localAPI : getMavisRegionUrl(opts.company)
  const url = new URL(mavisApiUrl)
  url.pathname = url.pathname.split('/').concat(trimStart(opts.path, '/')).filter(Boolean).join('/')

  // pickBy will remove any params with falsy values.
  // This is the default behavior unless preserveFalsyParams is passed, in which case falsy values will be preserved
  url.search = queryString.stringify(opts.preserveFalsyParams ? opts.params : pickBy(opts.params))

  let token
  if (isFunction(opts.getToken)) {
    token = await opts.getToken()
  }

  const fetchOpts: RequestInit = {
    ...opts.opts,
    method: opts.method,
    headers: baseHeaders(token, opts.contentType),
    body: opts.body,
    mode: 'cors',
    redirect: 'follow',
    credentials: 'omit',
  }

  let response = await fetcher(url.toString(), fetchOpts)

  if (!response.ok) {
    let errorResponse
    try {
      errorResponse = await response.json()
    } catch (err) {
      logger.error(
        {
          err,
          status: response.status,
          path: opts.path,
          params: opts.params,
        },
        'Failed to parse mavis api error response'
      )
      throw new MavisApiError(`Error: Unknown Error`, response.status, errorResponse)
    }

    if (response.status === 507) {
      try {
        // Handle presigned location response
        response = await fetch(errorResponse.location)
        if (!response.ok) {
          throw new Error('Failed to fetch presigned response')
        }
      } catch (err) {
        logger.error(
          {
            err,
            status: response.status,
            path: opts.path,
            params: opts.params,
          },
          'Failed to fetch presigned response'
        )
        throw new MavisApiError(`Error: ${(err as Error).message}`, response.status, errorResponse)
      }
    } else {
      // Handle error response
      const errorMessage = parseErrorMessage(errorResponse)
      throw new MavisApiError(`Error: ${errorMessage}`, response.status, errorResponse)
    }
  }

  // Empty success responses should default to an empty object
  if (response.status === 204) {
    return {} as unknown as T
  }

  if (opts.blobResponse) {
    return (await response.blob()) as unknown as T
  }

  if (opts.textResponse) {
    return (await response.text()) as unknown as T
  }

  // handle if response was OK, but empty object
  const jsonResponse = await response.json()

  if (isNil(jsonResponse)) {
    return { success: true } as T
  }

  return jsonResponse as T
}
