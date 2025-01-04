import type { PopoverContentProps } from '@radix-ui/react-popover'
import { Content, Portal } from '@radix-ui/react-popover'
import clsx from 'clsx'
import React, { forwardRef, Ref } from 'react'

interface Props extends PopoverContentProps {
  children: React.ReactNode

  /** Portal the content into the body */
  usePortal?: boolean
}

function PopoverContent({ children, className, usePortal = false, ...props }: Props, ref: Ref<HTMLDivElement>) {
  const content = (
    <Content ref={ref} className={clsx('z-50', className)} {...props}>
      {children}
    </Content>
  )

  if (!usePortal) return content
  return <Portal>{content}</Portal>
}

export default forwardRef(PopoverContent)
