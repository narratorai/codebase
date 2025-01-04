import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

type UseDelayedStateReturn<T> = [T, (value: T) => void]

const useDelayedState = <T>(initialValue: T, delay: number = 1000): UseDelayedStateReturn<T> => {
  const [state, setState] = useState<T>(initialValue)

  const setDelayedState = useDebouncedCallback(setState, delay)

  return [state, setDelayedState]
}

export default useDelayedState
