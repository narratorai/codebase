import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const OptionContents = (props: Props, ref: Ref) => (
  <div
    className={clsx(
      // Base styles
      'px-3.5 py-2.5 sm:px-3 sm:py-1.5',
      // Use grid layout
      'grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center',
      // Icons
      '[&>[data-slot=icon]]:col-start-1 [&>[data-slot=icon]]:row-start-1 [&>[data-slot=icon]]:-ml-0.5 [&>[data-slot=icon]]:mr-2.5 [&>[data-slot=icon]]:size-5 sm:[&>[data-slot=icon]]:mr-2 [&>[data-slot=icon]]:sm:size-4',
      '[&>[data-slot=icon]]:text-zinc-500 [&>[data-slot=icon]]:group-data-[focus]:text-white [&>[data-slot=icon]]:dark:text-zinc-400 [&>[data-slot=icon]]:group-data-[focus]:dark:text-white',
      // Avatar
      '[&>[data-slot=avatar]]:-ml-1 [&>[data-slot=avatar]]:mr-2.5 [&>[data-slot=avatar]]:size-6 sm:[&>[data-slot=avatar]]:mr-2 sm:[&>[data-slot=avatar]]:size-5',
      // Selection
      '[&>[data-slot=selection]]:invisible [&>[data-slot=selection]]:col-start-5 [&>[data-slot=selection]]:row-start-1 [&>[data-slot=selection]]:size-5 [&>[data-slot=selection]]:self-center [&>[data-slot=selection]]:stroke-current [&>[data-slot=selection]]:group-data-[selected]:visible [&>[data-slot=selection]]:sm:size-4'
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(OptionContents)
