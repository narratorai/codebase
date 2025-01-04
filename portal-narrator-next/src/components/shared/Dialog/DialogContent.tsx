import type { DialogContentProps } from '@radix-ui/react-dialog'
import { Content, Portal } from '@radix-ui/react-dialog'
import clsx from 'clsx'
import React, { ForwardedRef, forwardRef } from 'react'

import DialogOverlay from './DialogOverlay'

type ContentProps = Omit<DialogContentProps, 'className'> & React.RefAttributes<HTMLDivElement>

interface Props extends ContentProps {
  children: React.ReactNode
  className?: clsx.ClassValue

  /** Whether to close the dialog when clicking outside of it. */
  closeOnOutsideClick?: boolean
}

const DialogContent = (
  { children, className, onInteractOutside, closeOnOutsideClick = false, ...props }: Props,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const handleInteractOutside = (event: CustomEvent) => {
    if (!closeOnOutsideClick) event.preventDefault()
    else return onInteractOutside?.(event)
  }

  return (
    <Portal>
      <DialogOverlay />
      <Content
        ref={ref}
        className={clsx(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-xl',
          className
        )}
        onInteractOutside={handleInteractOutside}
        {...props}
      >
        {children}
      </Content>
    </Portal>
  )
}

export default forwardRef(DialogContent)
