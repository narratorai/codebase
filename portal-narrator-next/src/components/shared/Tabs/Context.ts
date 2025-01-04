import { createContext } from 'react'

interface Dimensions {
  width: number
  height: number
  top: number
  left: number
}

interface Props {
  activeValue: string | null
  activeTriggerDimensions: Dimensions
  setActiveTriggerDimensions: (dimensions: Dimensions) => void
}

const Context = createContext<Props>({
  activeValue: null,
  activeTriggerDimensions: { width: 0, height: 0, top: 0, left: 0 },
  setActiveTriggerDimensions: () => {},
})

export default Context
