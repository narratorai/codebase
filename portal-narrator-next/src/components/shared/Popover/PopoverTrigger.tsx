import { Trigger } from '@radix-ui/react-popover'
import clsx from 'clsx'
import React from 'react'

interface Props {
  children: React.ReactNode
  className?: clsx.ClassValue
  onClick?: () => void
}

export default function PopoverTrigger({ children, className, onClick }: Props) {
  return (
    <Trigger asChild>
      <button onClick={onClick} className={clsx(className)}>
        {children}
      </button>
    </Trigger>
  )
}
