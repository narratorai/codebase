import type { SelectValueProps } from '@radix-ui/react-select'
import { Value } from '@radix-ui/react-select'
import React from 'react'

type ValueProps = SelectValueProps & React.RefAttributes<HTMLSpanElement>

interface Props extends ValueProps {
  children?: React.ReactNode
}

const SelectValue = ({ children, ...props }: Props) => (
  <Value {...props} className="text-xs font-medium disabled:text-gray-200">
    {children}
  </Value>
)

export default SelectValue
