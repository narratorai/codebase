import React, { ForwardedRef, forwardRef, useContext } from 'react'

import { PopoverContent } from '@/components/shared/Popover'

import Context from './Context'

interface Props {
  children: React.ReactNode
  /**
   * The distance in pixels from the boundary edges where collision detection should occur.
   * Accepts a number (same for all sides), or a partial padding object, for example: { top: 20, left: 20 }.
   */
  collisionPadding?: number

  /**
   * Event handler called when focus moves into the component after opening. It can be prevented by
   * calling event.preventDefault.
   */
  onOpenAutoFocus?: (event: Event) => void
}

const MultiSelectContent = (
  { collisionPadding = 32, onOpenAutoFocus, children }: Props,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const { clearFocus, handleClose } = useContext(Context)

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault()
    clearFocus()
    onOpenAutoFocus?.(event)
  }

  return (
    <PopoverContent
      ref={ref}
      sideOffset={8}
      collisionPadding={collisionPadding}
      sticky="always"
      avoidCollisions
      onInteractOutside={handleClose}
      onEscapeKeyDown={handleClose}
      onOpenAutoFocus={handleOpenAutoFocus}
      className="h-full max-h-svh min-h-16 w-full min-w-80 max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl bordered-gray-100"
      usePortal
    >
      {children}
    </PopoverContent>
  )
}

export default forwardRef(MultiSelectContent)
