import { isFunction, noop } from 'lodash'
import { useCallback, useRef } from 'react'

// taken from https://github.com/getredash/redash/blob/master/client/app/lib/hooks/useImmutableCallback.js

// This hook wraps a potentially changeable function object and always returns the same
// function so it's safe to use it with other hooks: wrapper function stays the same,
// but will always call a latest wrapped function.
// A quick note regarding `react-hooks/exhaustive-deps`: since wrapper function doesn't
// change, it's safe to use it as a dependency, it will never trigger other hooks.
export default function useImmutableCallback(callback: Function) {
  const callbackRef = useRef<Function>(noop)
  callbackRef.current = isFunction(callback) ? callback : noop

  return useCallback((...args: any) => callbackRef.current(...args), [])
}
