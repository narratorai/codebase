import clsx from 'clsx'
import React from 'react'

import { InputType } from './interfaces'

interface Props {
  value: InputType
  label: string
  selectedValue: InputType
  onClick?: (value: InputType) => void
}

const DateInputTypeOption = ({ value, label, selectedValue, onClick }: Props) => (
  <button
    className={clsx('button button-xs secondary text !w-fit !px-4 focus:!shadow-none active:!shadow-none', {
      '!border-gray-50 !bg-gray-50': value === selectedValue,
    })}
    onClick={() => onClick?.(value)}
  >
    {label}
  </button>
)

export default DateInputTypeOption
