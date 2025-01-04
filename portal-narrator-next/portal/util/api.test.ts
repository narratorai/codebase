import fetchMock from 'jest-fetch-mock'
import { retryFetch } from './api'
import { compact } from 'lodash'

// Speed things up for test
const testRetryDelay = () => 0

describe('util/api', () => {
  describe('#retryFetch', () => {
    beforeEach(() => {
      fetchMock.resetMocks()
    })

    it('makes a request and returns result if successful', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: '12345' }), { headers: { 'Content-Type': 'application/json' } })

      const result = await retryFetch('https://example.com', { retryDelay: testRetryDelay })
      const response = await result.json()

      expect(response).toEqual({ data: '12345' })
    })

    it('makes a request and does not retry on error if status not in retry_on', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: '12345' }), {
        status: 418,
        headers: { 'Content-Type': 'application/json' },
      })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, 3, [504])

      expect(fetchMock.mock.calls.length).toEqual(1)
    })

    it('makes a request and does not retry on error if retries is 0', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: '12345' }), {
        status: 418,
        headers: { 'Content-Type': 'application/json' },
      })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, 0, [504])

      expect(fetchMock.mock.calls.length).toEqual(1)
    })

    it('makes a request and does retry on error if retries is undefined', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: '12345' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, undefined, [504])

      expect(fetchMock.mock.calls.length).toEqual(16)
    })

    it('makes a request and does retry on error if status in retry_on', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: '12345' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, 3, [504])

      expect(fetchMock.mock.calls.length).toEqual(4)
    })

    it('includes a narrator-retry-id header on the initial request', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: '12345' }), { headers: { 'Content-Type': 'application/json' } })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, 3, [504])

      const requestToTest = fetchMock.mock.calls[0]?.[0] as Request
      const retryId = (requestToTest?.headers as unknown as Map<string, string>)?.get('narrator-retry-id')
      expect(retryId).toBeTruthy()
    })

    it('includes the same narrator-retry-id header on all retry requests', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: '12345' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, 3, [504])

      const retryIds = compact(
        fetchMock.mock.calls.map((call) =>
          (call[1]?.headers as unknown as Map<string, string>)?.get('narrator-retry-id')
        )
      )

      expect(retryIds.every((v) => v === retryIds[0])).toEqual(true)
    })

    it('includes the narrator-retry header on all retry requests', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: '12345' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })

      await retryFetch('https://example.com', { retryDelay: testRetryDelay }, 3, [504])

      const retryHeader = fetchMock.mock.calls.map((call) =>
        (call[1]?.headers as unknown as Map<string, string>)?.get('narrator-retry')
      )

      const [initialRequestRetryHeader, ...retryRequestsRetryHeader] = retryHeader

      // Initial request does not have header
      expect(initialRequestRetryHeader).toBeFalsy()
      // Retry requests all do
      expect(retryRequestsRetryHeader.every((v) => v === retryRequestsRetryHeader[0])).toEqual(true)
    })
  })
})
