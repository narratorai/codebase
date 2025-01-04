import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Options = (props: Props, ref: Ref) => (
  <div
    className={clsx(
      // Anchor positioning
      '[--anchor-gap:theme(spacing.2)] [--anchor-padding:theme(spacing.1)]',
      // Base styles
      'isolate w-max min-w-[var(--button-width)] rounded-md py-1',
      // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
      'outline outline-1 outline-transparent focus:outline-none',
      // Handle scrolling when menu won't fit in viewport
      'overflow-y-auto',
      // Popover background
      'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',
      // Shadows
      'shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10',
      // Define grid at the menu level if subgrid is supported
      // 'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
      // Transitions
      'transition data-[closed]:data-[leave]:opacity-0 data-[leave]:duration-100 data-[leave]:ease-in'
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(Options)
