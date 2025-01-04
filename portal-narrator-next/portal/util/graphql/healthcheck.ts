import fetchRetry from 'fetch-retry'

const retrier = fetchRetry(fetch, {
  retries: 15,
  retryOn: [429, 500, 501, 502, 503, 504],
  retryDelay: (attempt: number) => {
    // Exponential backoff with jitter
    // With these parameters, 15 retries will complete over ~54 minutes
    return Math.floor(Math.pow(2, attempt) * 100 + Math.random() * 100) // ms
  },
})

const graphHealthcheck = async (): Promise<boolean> => {
  try {
    await retrier(`https://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}/healthz`)
    return true
  } catch (err) {
    return false
  }
}

export { graphHealthcheck }
