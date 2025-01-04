import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const OptionSection = (props: Props, ref: Ref) => <div {...props} ref={ref} />

export default forwardRef(OptionSection)
