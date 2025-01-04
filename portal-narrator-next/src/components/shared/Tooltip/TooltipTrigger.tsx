import { Trigger } from '@radix-ui/react-tooltip'
import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  asChild?: boolean
  className?: clsx.ClassValue
}

/**
 * The button that toggles the tooltip. By default, the tooltip content will
 * position itself against the trigger.
 */
export default function TooltipTrigger({ children, asChild = true, className }: Props) {
  return (
    <Trigger asChild={asChild} className={clsx(className)}>
      {children}
    </Trigger>
  )
}
