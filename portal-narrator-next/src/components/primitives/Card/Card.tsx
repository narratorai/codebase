import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  mobile?: boolean
  well?: boolean
  divided?: boolean
  gray?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Card = ({ divided = false, gray = false, mobile = false, well = false, ...props }: Props, ref: Ref) => (
  <section
    className={clsx(
      'h-full overflow-hidden',
      mobile ? 'sm:rounded-lg' : 'rounded-lg',
      well ? (gray ? 'bg-gray-200' : 'bg-gray-50') : 'bg-white shadow',
      divided && 'divide-y divide-gray-200'
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(Card)
