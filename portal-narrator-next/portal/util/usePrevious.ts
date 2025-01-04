import { useEffect, useRef } from 'react'

export default function usePrevious<T = any>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
