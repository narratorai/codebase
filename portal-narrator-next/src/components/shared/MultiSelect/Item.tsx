import React, { useContext, useEffect } from 'react'

import Context from './Context'

interface Props {
  value: string
  children: React.ReactElement
}

const Item = ({ value, children }: Props) => {
  const { handleSelect, itemSelected, itemFocused, registerValue } = useContext(Context)
  const isSelected = itemSelected(value)
  const isFocused = itemFocused(value)
  useEffect(() => {
    registerValue(value)
  }, [value])

  if (children === null) return children

  return <li>{React.cloneElement(children, { isSelected, isFocused, onSelect: handleSelect })}</li>
}

export default Item
