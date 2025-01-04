import { useEffect, useRef, useCallback } from 'react'
import { useHistory } from 'react-router'
import _ from 'lodash'
//
// Prevent back and prevent close
//

// dontBlockNavigationOnPathPrefix allows you to ignore path changes
// i.e. for switching tabs in blocks - changes url, but we don't want to trigger
// a block each time you switch tabs
const usePreventBack = (dontBlockNavigationOnPathPrefix?: string) => {
  const history = useHistory()
  const unblock = useRef<any>(null)

  // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  const preventClose: EventListenerOrEventListenerObject = (event) => {
    event.preventDefault()
    // Chrome requires returnValue to be set.
    event.returnValue = false
  }

  const cleanup = useCallback(() => {
    if (unblock.current) {
      // call unblock to allow navigation again
      unblock.current()
      window.removeEventListener('beforeunload', preventClose)
    }
  }, [])

  const onDirtyChange = useCallback(
    (dirty: boolean) => {
      if (dirty) {
        unblock.current = history.block((location) => {
          // skip if new path starts with prefix specified to skip prevent back
          if (_.startsWith(location.pathname, dontBlockNavigationOnPathPrefix)) {
            return undefined
          }

          return 'You have made changes. Are you sure you want to leave?'
        })

        // https://github.com/remix-run/history/blob/main/docs/blocking-transitions.md#caveats
        // this catches reload attempts (non-in page navigations)
        window.addEventListener('beforeunload', preventClose)
      } else {
        cleanup()
      }
    },
    [cleanup, history, dontBlockNavigationOnPathPrefix]
  )

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return onDirtyChange
}

export default usePreventBack
