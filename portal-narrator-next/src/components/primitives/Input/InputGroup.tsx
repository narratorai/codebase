import clsx from 'clsx'

type Props = React.ComponentPropsWithoutRef<'span'>

const InputGroup = ({ children }: Props) => (
  <span
    className={clsx(
      'relative isolate block',
      '[&_input]:has-[[data-slot=icon]:first-child]:pl-10 [&_input]:has-[[data-slot=icon]:last-child]:pr-10 sm:[&_input]:has-[[data-slot=icon]:first-child]:pl-8 sm:[&_input]:has-[[data-slot=icon]:last-child]:pr-8',
      '[&>[data-slot=icon]]:pointer-events-none [&>[data-slot=icon]]:absolute [&>[data-slot=icon]]:top-3 [&>[data-slot=icon]]:z-10 [&>[data-slot=icon]]:size-5 sm:[&>[data-slot=icon]]:top-2.5 sm:[&>[data-slot=icon]]:size-4',
      '[&>[data-slot=icon]:first-child]:left-3 sm:[&>[data-slot=icon]:first-child]:left-2.5 [&>[data-slot=icon]:last-child]:right-3 sm:[&>[data-slot=icon]:last-child]:right-2.5',
      '[&>[data-slot=icon]]:text-zinc-500 dark:[&>[data-slot=icon]]:text-zinc-400',

      '[&_input]:has-[[data-slot=button]:first-child]:pl-11 [&_input]:has-[[data-slot=button]:last-child]:pr-11 sm:[&_input]:has-[[data-slot=button]:first-child]:pl-9 sm:[&_input]:has-[[data-slot=button]:last-child]:pr-9',
      '[&>[data-slot=button]]:absolute [&>[data-slot=button]]:top-0 [&>[data-slot=button]]:z-10 [&>[data-slot=button]]:cursor-pointer',
      '[&>[data-slot=button]:first-child]:left-0 [&>[data-slot=button]:last-child]:right-0',
      '[&>[data-slot=button]]:[--btn-icon-size:theme(spacing.6)] sm:[&>[data-slot=button]]:[--btn-icon-size:theme(spacing.5)]',
      '[&>[data-slot=button]:hover]:[--btn-icon:theme(colors.gray.400)] [&>[data-slot=button]]:[--btn-icon:theme(colors.gray.400)]'
    )}
    data-slot="control"
  >
    {children}
  </span>
)

export default InputGroup
