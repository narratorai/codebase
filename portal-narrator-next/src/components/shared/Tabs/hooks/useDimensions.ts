import { useState } from 'react'

interface Dimensions {
  width: number
  height: number
  top: number
  left: number
}

const useDimensions = () => {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0, top: 0, left: 0 })

  return {
    dimensions,
    setDimensions,
  }
}

export default useDimensions
