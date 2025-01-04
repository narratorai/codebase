import { offset, Placement } from '@floating-ui/dom'
import { safePolygon, useFloating, useFocus, useHover, useInteractions } from '@floating-ui/react'
import { useState } from 'react'

/**
 * Hook to create floating menus.
 *
 * @example
 * ```tsx
 * const { refs, floatingStyles, getReferenceProps, getFloatingProps } = useFloatingMenu()
 * return (
 *   <>
 *     <div ref={refs.setReference} {...getReferenceProps()}>
 *       Content
 *     </div>
 *     <div ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles}>
 *      Floating content
 *     </div>
 *   </>
 * )
 * ```
 */
export function useFloatingMenu(placement: Placement = 'top') {
  const [isOpen, setIsOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    placement,
    transform: true,
    middleware: [offset({ mainAxis: 10 })],
    open: isOpen,
    onOpenChange: setIsOpen,
  })

  const focus = useFocus(context)
  const hover = useHover(context, { handleClose: safePolygon() })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus])

  return { refs, floatingStyles, getReferenceProps, getFloatingProps, isOpen }
}
