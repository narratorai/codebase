import { App } from 'antd-next'
import { ArgsProps, NotificationInstance } from 'antd-next/es/notification/interface'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { ICompany } from 'graph/generated'
import { isEmpty } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FORM_DATA_CONTENT_TYPE } from 'util/constants'

import { IMavisRequestOptions, mavisRequest } from './mavis-api'

export interface MavisError extends Error {
  description?: string
  code: string
  type: string
}

export interface NotificationOptProps extends Omit<ArgsProps, 'message'> {
  error?: MavisError | null
}

// checks if reponse is present on the error object
// if not falls back to the original error, which at least will have message
export const handleFormatMavisError = (error: any) => error?.response || error

// https://stackoverflow.com/a/7888303/7949930
export const parseMavisErrorCode = (code: string) => code.split(/(?=[A-Z])/).join(' ')

const formatBody = (body?: any, contentType?: string) => {
  // handles file uploads
  if (contentType === FORM_DATA_CONTENT_TYPE) {
    return body
  }

  // handles empty body
  if (isEmpty(body)) {
    return undefined
  }

  // stringifies all other bodies
  return JSON.stringify(body)
}

interface HandleMavisErrorNotificationProps {
  error: MavisError
  notification: NotificationInstance
  notificationProps?: NotificationOptProps
}
export const handleMavisErrorNotification = ({
  error,
  notification,
  notificationProps = {},
}: HandleMavisErrorNotificationProps) => {
  const mavisError = handleFormatMavisError(error)
  const title = parseMavisErrorCode(mavisError.code || 'Failed to Fetch')

  notification.error({
    key: `${mavisError.code}_${mavisError.message}`,
    message: title,
    description: mavisError.message,
    duration: null,
    ...notificationProps,
  })
}

interface MavisResponse<T> {
  loading: boolean
  response: T | undefined
  error?: MavisError
  cancel: () => void
  reset: () => void
}

type CallbackParams<B> = {
  params?: Omit<IMavisRequestOptions['params'], 'company'>
  body?: B
  path?: string
}

type Fetcher<T, B> = ({ params, body }: CallbackParams<B>) => Promise<T | undefined>

type MavisLazyResponse<T, B> = [Fetcher<T, B>, MavisResponse<T>]

interface _InternalMavisState<T, B> extends MavisResponse<T> {
  fetchData: Fetcher<T, B>
  company: ICompany
  cancel: () => void
}

interface CallMavisParams<B = { [key: string]: any }>
  extends Omit<IMavisRequestOptions, 'params' | 'getToken' | 'company' | 'body'> {
  params?: { [key: string]: string | boolean | number | undefined }
  body?: B
  contentType?: string
  hideErrorNotification?: boolean
  errorNotificationProps?: NotificationOptProps
}

function _setupMavisCall<T, B = any>(opts: CallMavisParams<B>): _InternalMavisState<T, B> {
  const { getTokenSilently: getToken } = useAuth0()
  const company = useCompany()
  const { notification } = App.useApp()

  const [loading, setLoading] = useState<boolean>(false)
  const [response, setResponse] = useState<T>()
  const [error, setError] = useState<MavisError>()

  const controllerRef = useRef<AbortController>()

  const cancel = useCallback(() => {
    controllerRef?.current?.abort()
    controllerRef.current = new AbortController()
  }, [])

  const reset = useCallback(() => {
    cancel()
    setResponse(undefined)
    setLoading(false)
    setError(undefined)
  }, [cancel])

  const fetchData = useCallback(async ({ params, body, path: pathOverride }: CallbackParams<B>) => {
    setLoading(true)
    setError(undefined)

    const requestBody = body || opts.body || ({} as RequestInit['body'])
    const requestParams = params || opts.params

    let response
    try {
      if (controllerRef?.current?.signal) {
        // if an abort controller has been set, make sure to cancel it (from the previous run)
        controllerRef.current.abort()
      }

      // attach a controller to req for future aborts
      controllerRef.current = new AbortController()
      const formattedBody = formatBody(requestBody, opts.contentType)

      response = await mavisRequest<T>({
        ...opts,
        path: pathOverride || opts.path,
        opts: {
          ...opts.opts,
          signal: controllerRef.current.signal,
        },
        params: {
          company: company.slug,
          ...requestParams,
        },
        body: formattedBody,
        getToken,
        company,
      })

      if (response) {
        setResponse(response)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const mavisError = handleFormatMavisError(err)
        setError(mavisError)

        // show error notification
        if (!opts.hideErrorNotification) {
          // send original error to handler
          // since it is also used outside of this hook
          handleMavisErrorNotification({
            error: err as MavisError,
            notification,
            notificationProps: opts.errorNotificationProps,
          })
        }
      }
    } finally {
      setLoading(false)
    }

    return response
  }, [])

  return { fetchData, loading, response, error, company, cancel, reset }
}

type Body = { [key: string]: any }

/**
 * Hook to call Mavis and get a response.
 *
 * @example
 * const { response: formState } = useCallMavis<FormState>({ path: '/v1/metric/block_view', params: { metric_id: id } })
 */
function useCallMavis<T, B extends Body = Body>(opts: CallMavisParams<B>): MavisResponse<T> {
  const { fetchData, loading, response, error, cancel, reset } = _setupMavisCall<T, B>(opts)

  useEffect(() => {
    fetchData({})
  }, [fetchData])

  return { response, loading, error, cancel, reset }
}

// You must pass params AND/OR body to the callback function in lazy
export function useLazyCallMavis<T, B extends Body = Body>(
  opts: Omit<CallMavisParams<B>, 'params'>
): MavisLazyResponse<T, B> {
  const { fetchData, loading, response, error, cancel, reset } = _setupMavisCall<T, B>(opts)

  return [fetchData, { response, loading, error, cancel, reset }]
}

export default useCallMavis
