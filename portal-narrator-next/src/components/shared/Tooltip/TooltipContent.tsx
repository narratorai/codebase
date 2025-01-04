import { Arrow, Content, Portal } from '@radix-ui/react-tooltip'
import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  className?: string
  /** The preferred alignment against the trigger. May change when collisions occur. */
  align?: 'start' | 'center' | 'end'
  /** An offset in pixels from the "start" or "end" alignment options. */
  alignOffset?: number
  /** The preferred side of the trigger to render against when open. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** The distance in pixels from the trigger */
  sideOffset?: number
  /** Portal the content into the body */
  usePortal?: boolean
  hideArrow?: boolean
}

/**
 * The component that pops out when the tooltip is open.
 */
export default function TooltipContent({
  children,
  className,
  align,
  alignOffset,
  side,
  sideOffset,
  usePortal = false,
  hideArrow = false,
}: Props) {
  const content = (
    <Content
      className={clsx('z-40', className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
    >
      {children}
      {hideArrow ? null : <Arrow height={3} width={6} />}
    </Content>
  )

  if (!usePortal) return content
  return <Portal>{content}</Portal>
}
