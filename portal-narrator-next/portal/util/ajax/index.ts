import axios from 'axios'
import { IDatacenter_Region_Enum } from 'graph/generated'

import { login } from '@/util/auth'

import { getAuthToken } from './auth'

const mavisApiInstance = axios.create()

mavisApiInstance.interceptors.request.use(
  async function (config) {
    try {
      const apiToken = await getAuthToken()
      config.headers['Authorization'] = `Bearer ${apiToken}`
    } catch (error) {
      // Redirect to the login page when a new token cannot be obtained
      login()
    }

    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

function getBaseURL(datacenterRegion?: IDatacenter_Region_Enum | null) {
  const entryUrl = new URL(document.location.href)
  const useLocalMavis = entryUrl.searchParams.has('local_mavis')

  if (useLocalMavis) {
    return process.env.NEXT_PUBLIC_LOCAL_MAVIS_URL
  }

  if (datacenterRegion === IDatacenter_Region_Enum.Eu) {
    return process.env.NEXT_PUBLIC_MAVIS_EU_URL
  }

  return process.env.NEXT_PUBLIC_MAVIS_US_URL
}

function makeMavisRequest<Return, Params = Record<string, unknown>, Data = Record<string, unknown>>(
  method: 'post' | 'get' | 'delete' | 'put' | 'patch',
  url: string,
  data?: Data,
  datacenterRegion?: IDatacenter_Region_Enum | null,
  params?: Params
) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  return mavisApiInstance<Return>({
    method,
    url,
    headers,
    data,
    params,
    baseURL: getBaseURL(datacenterRegion),
    timeout: 1_800_000, // 30 minutes
  })
}

/**
 * Performs a GET request.
 */
export function fetchMavis<Return, Params = Record<string, unknown>>(
  url: string,
  requestConfig: {
    datacenterRegion?: IDatacenter_Region_Enum | null
    params?: Params
  }
) {
  const { datacenterRegion, params } = requestConfig
  return makeMavisRequest<Return, Params>('get', url, undefined, datacenterRegion, params)
}

/**
 * Performs a POST request.
 */
export function postMavis<Return, Data = Record<string, unknown>, Params = Record<string, unknown>>(
  url: string,
  requestConfig: {
    data: Data
    datacenterRegion?: IDatacenter_Region_Enum | null
    params?: Params
  }
) {
  const { data, datacenterRegion, params } = requestConfig
  return makeMavisRequest<Return, Params, Data>('post', url, data, datacenterRegion, params)
}

/**
 * Performs a DELETE request.
 */
export function deleteMavis<Return, Params = Record<string, unknown>>(
  url: string,
  requestConfig: {
    datacenterRegion?: IDatacenter_Region_Enum | null
    params?: Params
  }
) {
  const { datacenterRegion, params } = requestConfig
  return makeMavisRequest<Return, Params>('delete', url, undefined, datacenterRegion, params)
}

/**
 * Performs a PUT request.
 */
export function putMavis<Return, Data = Record<string, unknown>, Params = Record<string, unknown>>(
  url: string,
  requestConfig: {
    data: Data
    datacenterRegion?: IDatacenter_Region_Enum | null
    params?: Params
  }
) {
  const { data, datacenterRegion, params } = requestConfig
  return makeMavisRequest<Return, Params, Data>('put', url, data, datacenterRegion, params)
}

/**
 * Performs a PATCH request.
 */
export function patchMavis<Return, Data = Record<string, unknown>, Params = Record<string, unknown>>(
  url: string,
  requestConfig: {
    data: Data
    datacenterRegion?: IDatacenter_Region_Enum | null
    params?: Params
  }
) {
  const { data, datacenterRegion, params } = requestConfig
  return makeMavisRequest<Return, Params, Data>('patch', url, data, datacenterRegion, params)
}
