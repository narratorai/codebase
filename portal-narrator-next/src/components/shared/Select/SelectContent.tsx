import { Content, Viewport } from '@radix-ui/react-select'
import clsx from 'clsx'
import React from 'react'

interface Props {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
  className?: clsx.ClassValue
}

const SelectContent = ({
  children,
  align = 'start',
  alignOffset,
  side = 'bottom',
  sideOffset = 6,
  onScroll,
  className,
}: Props) => (
  <Content
    align={align}
    alignOffset={alignOffset}
    side={side}
    sideOffset={sideOffset}
    position="popper"
    className="z-50"
  >
    <Viewport onScroll={onScroll} className={clsx('rounded-lg bg-white p-2 shadow-sm bordered-gray-100', className)}>
      {children}
    </Viewport>
  </Content>
)

export default SelectContent
