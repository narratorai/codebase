import React from 'react'

import Context from './Context'
import { useFocus, useKeyboard, useMultiSelect, useOpen } from './hooks'
import Root from './Root'

interface Props {
  multiselect: 'none' | 'optional' | 'required'
  onValueChange?: (items: string[]) => void
  isOpen?: boolean
  setIsOpen?: (value: boolean) => void
  children: React.ReactNode
}

const MultiSelect = ({ multiselect = 'optional', onValueChange, isOpen, setIsOpen, children }: Props) => {
  const { handleOpen, handleClose, open } = useOpen(isOpen, setIsOpen)
  const { registerValue, replace, toggle, itemSelected, selected, items } = useMultiSelect(onValueChange)
  const { clearFocus, initiateFocus, moveFocus, itemFocused, getFocusedItem } = useFocus(items)

  const handleSelect = (value: string, single?: boolean) => {
    if (multiselect === 'none' || (multiselect === 'optional' && single)) {
      handleClose()
      replace(value)
      return
    }
    toggle(value)
  }

  const onArrowDownKeyDown = () => moveFocus(1)
  const onArrowUpKeyDown = () => moveFocus(-1)
  const onEnterKeyDown = () => {
    const focusedItem = getFocusedItem()
    handleSelect(focusedItem, true)
  }

  const onShiftEnterKeyDown = () => {
    const focusedItem = getFocusedItem()
    handleSelect(focusedItem, false)
  }

  const handleKeyboardEvent = useKeyboard(onArrowDownKeyDown, onArrowUpKeyDown, onShiftEnterKeyDown, onEnterKeyDown)

  return (
    <Context.Provider
      value={{
        multiselect,
        open,
        selected,
        registerValue,
        handleSelect,
        itemSelected,
        itemFocused,
        clearFocus,
        initiateFocus,
        handleKeyboardEvent,
        handleOpen,
        handleClose,
      }}
    >
      <Root>{children}</Root>
    </Context.Provider>
  )
}

export default MultiSelect
