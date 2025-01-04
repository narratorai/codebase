import type { SelectTriggerProps } from '@radix-ui/react-select'
import { Icon, Trigger, Value } from '@radix-ui/react-select'
import clsx from 'clsx'
import React from 'react'
import ChevronDownIcon from 'static/mavis/icons/chevron-down.svg'

type TriggerProps = SelectTriggerProps & React.RefAttributes<HTMLButtonElement>

interface Props extends TriggerProps {
  placeholder?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

const SelectTrigger = ({ children, className, placeholder }: Props) => (
  <Trigger
    className={clsx(
      'justify-between gap-1 overflow-hidden rounded-md bg-gray-50 p-2 text-sm flex-x-center active:outline active:outline-blue-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-gray-300 data-placeholder:text-gray-300',
      className
    )}
  >
    <Value placeholder={placeholder} asChild>
      <div className="truncate">{children}</div>
    </Value>
    <Icon>
      <ChevronDownIcon className="size-5 text-gray-1000" />
    </Icon>
  </Trigger>
)

export default SelectTrigger
