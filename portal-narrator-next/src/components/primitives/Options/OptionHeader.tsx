import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const OptionHeader = (props: Props, ref: Ref) => (
  <div className="col-span-5 px-3.5 pb-1 pt-2.5 sm:px-3" ref={ref} {...props} />
)

export default forwardRef(OptionHeader)
