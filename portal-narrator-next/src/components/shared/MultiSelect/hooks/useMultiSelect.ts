import { filter } from 'lodash'
import { useState } from 'react'

const filterSelectedToArray = (newItems: Map<string, boolean>): string[] => {
  const keys = [...newItems.keys()]
  return filter(keys, (key) => newItems.get(key)) as string[]
}

const useMultiSelect = (onValueChange?: (items: string[]) => void) => {
  const [items, setItems] = useState<Map<string, boolean>>(new Map())

  const registerValue = (value: string) => {
    setItems((oldItems) => {
      const newItems = new Map(oldItems.entries())
      const newState = oldItems.get(value) || false
      newItems.set(value, newState)
      return newItems
    })
  }

  const toggle = (value: string) => {
    setItems((oldItems) => {
      const newItems = new Map(oldItems.entries())
      const newState = !oldItems.get(value)
      newItems.set(value, newState)
      onValueChange?.(filterSelectedToArray(newItems))
      return newItems
    })
  }

  const replace = (value: string) => {
    setItems((oldItems) => {
      const newItems = new Map(oldItems.entries())
      newItems.forEach((_, key) => {
        newItems.set(key, false)
      })
      newItems.set(value, true)
      onValueChange?.(filterSelectedToArray(newItems))
      return newItems
    })
  }

  const itemSelected = (value: string) => items.get(value) || false

  const selected = filterSelectedToArray(items)

  return {
    items: [...items.keys()],
    selected,
    itemSelected,
    registerValue,
    replace,
    toggle,
  }
}

export default useMultiSelect
