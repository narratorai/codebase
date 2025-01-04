import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  mobile?: boolean
  breakpoint?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Container = ({ breakpoint = false, mobile = false, ...props }: Props, ref: Ref) => (
  <div
    className={clsx('mx-auto sm:px-6 lg:px-8', !mobile && 'px-4', breakpoint ? 'container' : 'max-w-7xl')}
    ref={ref}
    {...props}
  />
)

export default forwardRef(Container)
