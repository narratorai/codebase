import fetchRetry from 'fetch-retry'
import { FORM_DATA_CONTENT_TYPE } from 'util/constants'
import { v4 as uuidv4 } from 'uuid'

const retrier = fetchRetry(fetch, {
  retryDelay: (attempt: number) => {
    // Exponential backoff with jitter
    // With these parameters, 15 retries will complete over ~54 minutes
    return Math.floor(Math.pow(2, attempt) * 100 + Math.random() * 100) // ms
  },
})

interface RetryInit extends RequestInit {
  retryDelay?: (attempt: number) => number
  skipRetryHeaders?: boolean
}

export const retryFetch = async (
  input: Parameters<typeof fetch>[0],
  init?: RetryInit,
  retries?: number,
  retryOn?: number[]
): Promise<Response> => {
  // Retry defaults
  retries = retries ?? 15
  retryOn = retryOn ?? [504]

  // Generate a request id so we can tie retries to eachother
  // NOTE for CORS requests, the origin must include narrator-retry and narrator-retry-id in its https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
  const requestHeaders = new Headers(init?.headers || {})
  if (!init?.skipRetryHeaders) {
    const requestId = uuidv4()
    requestHeaders.set('narrator-retry-id', requestId)
  }

  // try the request once
  const response = await fetch(input, { ...init, headers: requestHeaders })
  if (response.ok) {
    // Return if it succeeds
    return response
  } else {
    if (!retryOn.includes(response.status) || !retries || retries <= 1) {
      // Pass error response through if status should not be retried, or no retries configured
      return response
    } else {
      // Otherwise, setup and retry the request
      const retryHeaders = new Headers(requestHeaders)
      if (!init?.skipRetryHeaders) {
        // Flag as a retry
        retryHeaders.set('narrator-retry', 'true')
      }
      // Set up the retry
      // Subtract one to exclude the current attempt
      return retrier(input, { ...init, retries: Math.max(retries - 1, 0), retryOn, headers: retryHeaders })
    }
  }
}

export const baseHeaders = (token?: string, contentType?: string): Record<string, string> => {
  // allow browser to auto-detect content type for FormData
  // (remove Content-Type for auto-detect)
  if (contentType === FORM_DATA_CONTENT_TYPE) {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  // otherwise include Content-Type in header
  // (default to application/json)
  return {
    'Content-Type': contentType || 'application/json',
    Authorization: `Bearer ${token}`,
  }
}
