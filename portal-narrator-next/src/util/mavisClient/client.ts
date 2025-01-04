import camelcaseKeys from 'camelcase-keys'
import { IDatacenter_Region_Enum } from 'graph/generated' // TODO: Consider eliminating this dependency (e.g., move the code here)
import ky, { HTTPError, SearchParamsOption } from 'ky'
import { isNil } from 'lodash'

import { login } from '@/util/auth'

import { APIError } from './errors'
import { getAPIToken } from './token'

export type TDatacenterRegion = IDatacenter_Region_Enum | null
export type TSearchParams = SearchParamsOption

const mavisClient = ky.extend({
  retry: 0, // Handle retries in the application layer
  hooks: {
    beforeRequest: [
      async (request: Request) => {
        try {
          const token = await getAPIToken()
          const { accessToken, type } = token

          if (type === 'bearer') {
            request.headers.set('Authorization', `Bearer ${accessToken}`)
          } else {
            request.headers.set('X-API-KEY', accessToken)
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Redirect to the login page when a new token cannot be obtained
          login()
        }
      },
    ],
  },
})

function getBaseURL(datacenterRegion?: TDatacenterRegion) {
  const entryUrl = new URL(document.location.href)
  const useLocalMavis = entryUrl?.searchParams.has('local_mavis')

  if (useLocalMavis) {
    return process.env.NEXT_PUBLIC_LOCAL_MAVIS_URL
  }

  if (datacenterRegion === IDatacenter_Region_Enum.Eu) {
    return process.env.NEXT_PUBLIC_MAVIS_EU_URL
  }

  return process.env.NEXT_PUBLIC_MAVIS_US_URL
}

function makeMavisRequest<TData = Record<string, unknown>>(
  method: 'post' | 'get' | 'delete' | 'put' | 'patch',
  url: string,
  data?: TData,
  datacenterRegion?: TDatacenterRegion,
  searchParams?: TSearchParams,
  handleProgress?: (chunk: string, progress: number) => void
) {
  const isFormData = data instanceof FormData
  const isStreamResponse = !isNil(handleProgress)
  const inputUrl = url.replace(/^\/+/, '')
  const headers = {
    Accept: isStreamResponse ? 'text/event-stream' : 'application/json',
  }

  return mavisClient(inputUrl, {
    method,
    headers,
    mode: 'cors',
    json: isFormData ? undefined : data,
    body: isFormData ? data : undefined,
    searchParams,
    prefixUrl: getBaseURL(datacenterRegion),
    timeout: 1_800_000, // 30 minutes
    parseJson: (text: string) => {
      if (isStreamResponse) return text
      return camelcaseKeys(JSON.parse(text), { deep: true })
    },
    onDownloadProgress: isStreamResponse
      ? (progress: { percent: number; totalBytes: number; transferredBytes: number }, chunk: Uint8Array) => {
          const decoder = new TextDecoder('utf-8')
          const string = decoder.decode(chunk)
          handleProgress(string, progress.percent)
        }
      : undefined,
    hooks: {
      beforeError: [
        async (error) => {
          if (error instanceof HTTPError && error.response) {
            const { status } = error.response
            const errorJson = await error.response.json()
            const { code, message, description } = errorJson as { code: string; message: string; description: string[] }
            throw new APIError(status, code, message, description)
          }

          throw error
        },
      ],
    },
  })
}

/**
 * Performs a GET request.
 */
export function getMavis<TReturn>(
  url: string,
  options: {
    params?: TSearchParams
    datacenterRegion?: TDatacenterRegion
    onChunkReceived?: (chunk: string, progress: number) => void
  }
) {
  const { datacenterRegion, params, onChunkReceived } = options
  return makeMavisRequest('get', url, undefined, datacenterRegion, params, onChunkReceived).json<TReturn>()
}

/**
 * Performs a POST request.
 */
export function postMavis<TReturn, TData = Record<string, unknown>>(
  url: string,
  options: {
    data: TData
    params?: TSearchParams
    datacenterRegion?: TDatacenterRegion
    onChunkReceived?: (chunk: string, progress: number) => void
  }
) {
  const { data, datacenterRegion, params, onChunkReceived } = options
  return makeMavisRequest<TData>('post', url, data, datacenterRegion, params, onChunkReceived).json<TReturn>()
}

/**
 * Performs a DELETE request.
 */
export function deleteMavis<TReturn>(
  url: string,
  options: {
    params?: TSearchParams
    datacenterRegion?: TDatacenterRegion
  }
) {
  const { datacenterRegion, params } = options
  return makeMavisRequest('delete', url, undefined, datacenterRegion, params).json<TReturn>()
}

/**
 * Performs a PUT request.
 */
export function putMavis<TReturn, TData = Record<string, unknown>>(
  url: string,
  options: {
    data: TData
    params?: TSearchParams
    datacenterRegion?: TDatacenterRegion
  }
) {
  const { data, datacenterRegion, params } = options
  return makeMavisRequest<TData>('put', url, data, datacenterRegion, params).json<TReturn>()
}

/**
 * Performs a PATCH request.
 */
export function patchMavis<TReturn, TData = Record<string, unknown>>(
  url: string,
  options: {
    data: TData
    params?: TSearchParams
    datacenterRegion?: TDatacenterRegion
  }
) {
  const { data, datacenterRegion, params } = options
  return makeMavisRequest<TData>('patch', url, data, datacenterRegion, params).json<TReturn>()
}
