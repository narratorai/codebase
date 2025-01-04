import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLParagraphElement>

type Props = Omit<React.ComponentPropsWithoutRef<'p'>, 'className'>

const OptionLabel = (props: Props, ref: Ref) => <p className="col-start-2 row-start-1 truncate" ref={ref} {...props} />

export default forwardRef(OptionLabel)
