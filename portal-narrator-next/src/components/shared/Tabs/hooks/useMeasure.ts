import { RefObject, useEffect, useRef, useState } from 'react'

interface Dimensions {
  width: number
  height: number
  top: number
  left: number
}

const useMeasure = <T extends HTMLElement>(): [RefObject<T>, Dimensions] => {
  const ref = useRef<T>(null)
  const [dimensions, setDimensions] = useState<Dimensions>({ left: 0, top: 0, width: 0, height: 0 })

  const ro = new ResizeObserver(([entry]) =>
    setDimensions({
      left: (entry.target as T).offsetLeft,
      top: (entry.target as T).offsetTop,
      width: (entry.target as T).offsetWidth,
      height: (entry.target as T).offsetHeight,
    })
  )

  useEffect(() => {
    if (ref.current) {
      ro.observe(ref.current)
      return () => ro.disconnect()
    }
  }, [])

  return [ref, dimensions]
}

export default useMeasure
