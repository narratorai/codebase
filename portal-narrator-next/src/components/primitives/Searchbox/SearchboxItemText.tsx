import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLParagraphElement>

type Props = {
  truncate?: boolean
} & Omit<React.ComponentPropsWithoutRef<'p'>, 'className'>

const SearchboxItemText = ({ truncate, ...props }: Props, ref: Ref) => (
  <p
    className={clsx('text-nowrap text-sm text-gray-500 group-data-[focus]:text-gray-700', truncate && 'truncate')}
    ref={ref}
    {...props}
  />
)

export default forwardRef(SearchboxItemText)
