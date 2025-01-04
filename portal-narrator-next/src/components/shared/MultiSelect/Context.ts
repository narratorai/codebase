import React, { createContext } from 'react'

interface Props {
  multiselect: 'none' | 'optional' | 'required'
  open: boolean
  selected: string[]
  registerValue: (value: string) => void
  handleSelect: (value: string, single?: boolean) => void
  itemSelected: (value: string) => boolean
  itemFocused: (value: string) => boolean
  clearFocus: () => void
  initiateFocus: () => void
  handleKeyboardEvent: (event: React.KeyboardEvent) => void
  handleOpen: () => void
  handleClose: () => void
}

const Context = createContext<Props>({
  multiselect: 'optional',
  open: false,
  selected: [],
  registerValue: () => {},
  handleSelect: () => {},
  itemSelected: () => false,
  itemFocused: () => false,
  clearFocus: () => {},
  initiateFocus: () => {},
  handleKeyboardEvent: () => {},
  handleOpen: () => {},
  handleClose: () => {},
})

export default Context
