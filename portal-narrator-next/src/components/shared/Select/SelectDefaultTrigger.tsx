import type { SelectTriggerProps } from '@radix-ui/react-select'
import { Trigger } from '@radix-ui/react-select'
import clsx from 'clsx'
import React from 'react'
import ChevronDownIcon from 'static/mavis/icons/chevron-down.svg'

import { Label, Tag } from '@/components/shared/Tag'

type TriggerProps = SelectTriggerProps & React.RefAttributes<HTMLButtonElement>

interface Props extends TriggerProps {
  placeholder?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

const SelectDefaultTrigger = ({ children, className, placeholder }: Props) => (
  <Trigger
    className={clsx(
      'cursor-pointer justify-between gap-1 rounded-lg p-1 shadow-sm bordered-gray-100 flex-x-center',
      className
    )}
  >
    {children !== undefined && (
      <Tag size="lg" color="white">
        <Label>{children}</Label>
      </Tag>
    )}

    {children === undefined && placeholder !== undefined && (
      <Tag size="lg" color="transparent">
        <Label>{placeholder}</Label>
      </Tag>
    )}

    <ChevronDownIcon className="size-5" />
  </Trigger>
)

export default SelectDefaultTrigger
