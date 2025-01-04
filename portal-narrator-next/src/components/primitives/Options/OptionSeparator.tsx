import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const OptionSeparator = (props: Props, ref: Ref) => (
  <div
    className="col-span-full my-1 h-px border-0 bg-zinc-950/5 dark:bg-white/10 forced-colors:bg-[CanvasText]"
    ref={ref}
    {...props}
  />
)

export default forwardRef(OptionSeparator)
