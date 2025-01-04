import { useState } from 'react'

import { getLogger } from '@/util/logger'
const logger = getLogger()

const useLocalStorage = <T = any>(key: string, initialValue: T): [T, (val: T) => void] => {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  // nosemgrep: typescript.react.best-practice.react-props-in-state.react-props-in-state
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (err) {
      // If error also return initialValue
      logger.debug({ err, key }, 'error getting stored value')
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Save state
      setStoredValue(valueToStore)
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) {
      // A more advanced implementation would handle the error case
      logger.debug({ err, key }, 'error setting stored value')
    }
  }

  return [storedValue, setValue]
}

export default useLocalStorage
