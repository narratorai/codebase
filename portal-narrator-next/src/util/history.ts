import { createBrowserHistory, createMemoryHistory } from 'history'
import analytics from 'util/analytics' // TODO: Consider eliminating this dependency (e.g., move the code here)

import { isServer } from '@/util/env'

const history = isServer ? createMemoryHistory() : createBrowserHistory()

// Track client routing
if (!isServer) {
  history.listen(() => {
    // NOTE - this is subsequent page views
    // Initial page view is in index.tsx where we render <Root>
    analytics.page()
  })
}

export default history
