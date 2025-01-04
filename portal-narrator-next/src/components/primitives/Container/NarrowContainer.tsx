import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const NarrowContainer = (props: Props, ref: Ref) => <div className="mx-auto max-w-3xl" ref={ref} {...props} />

export default forwardRef(NarrowContainer)
