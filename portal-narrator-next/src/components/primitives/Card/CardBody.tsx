import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  gray?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const CardBody = ({ gray = false, ...props }: Props, ref: Ref) => (
  <div className={clsx('px-4 py-5 sm:p-6', gray && 'bg-gray-50')} ref={ref} {...props} />
)

export default forwardRef(CardBody)
