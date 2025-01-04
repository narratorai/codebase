import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLHRElement>

type Props = Omit<React.ComponentPropsWithoutRef<'hr'>, 'className'>

const OptionDivider = (props: Props, ref: Ref) => (
  <hr
    className="col-span-full h-px border-0 bg-zinc-950/5 dark:bg-white/10 forced-colors:bg-[CanvasText]"
    ref={ref}
    {...props}
  />
)

export default forwardRef(OptionDivider)
