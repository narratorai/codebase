import { useState, useCallback } from 'react'

const useToggle = (initialValue = false): [boolean, () => void, (v: boolean) => void] => {
  const [value, setValue] = useState<boolean>(initialValue)

  const toggle = useCallback(() => {
    setValue((v) => !v)
  }, [])

  return [value, toggle, setValue]
}

export default useToggle
