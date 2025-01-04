import { useCallback, useState } from 'react'

const useFocus = (items: string[]) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const moveFocus = (step: number) => {
    setFocusedIndex((oldIndex) => {
      const count = items.length
      const rawIndex = (oldIndex + step) % count
      const newIndex = rawIndex < 0 ? count + rawIndex : rawIndex
      return newIndex
    })
  }

  const getFocusedItem = () => items[focusedIndex]

  const initiateFocus = useCallback(() => {
    if (focusedIndex === -1) {
      setFocusedIndex(0)
    }
  }, [focusedIndex])

  const clearFocus = useCallback(() => {
    setFocusedIndex(-1)
  }, [])

  const itemFocused = (value: string) => items[focusedIndex] === value

  return {
    moveFocus,
    getFocusedItem,
    itemFocused,
    clearFocus,
    initiateFocus,
  }
}

export default useFocus
