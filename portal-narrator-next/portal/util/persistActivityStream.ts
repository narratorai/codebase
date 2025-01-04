// Persists the last selected activity stream slug in localstorage for convenience and faster init

import { ICompany } from 'graph/generated'
import { find } from 'lodash'

const NARRATOR_ACTIVITY_STREAM_KEY = 'narrator_activity_stream'

export const persistActivityStream = (activityStream: string): void => {
  localStorage.setItem(NARRATOR_ACTIVITY_STREAM_KEY, activityStream)
}

export const loadPersistedActivityStreamSlug = (company: ICompany): string | null => {
  try {
    const activityStream = localStorage.getItem(NARRATOR_ACTIVITY_STREAM_KEY)
    // if there is a set default activity stream
    // make sure that table still exists before sending it back
    const table = find(company.tables, ['activity_stream', activityStream])
    if (table) {
      return activityStream
    } else {
      // clear the activity stream if the table no longer exists
      clearPersistedActivityStream()
      return null
    }
  } catch {
    clearPersistedActivityStream()
    return null
  }
}

export const loadPersistedActivityStream = (company: ICompany) => {
  try {
    const activityStream = localStorage.getItem(NARRATOR_ACTIVITY_STREAM_KEY)
    // if there is a set default activity stream
    // make sure that table still exists before sending it back
    const table = find(company.tables, ['activity_stream', activityStream])
    if (table) {
      return table
    } else {
      // clear the activity stream if the table no longer exists
      clearPersistedActivityStream()
    }
  } catch {
    clearPersistedActivityStream()
  }

  return null
}

export const clearPersistedActivityStream = () => {
  localStorage.removeItem(NARRATOR_ACTIVITY_STREAM_KEY)
}
