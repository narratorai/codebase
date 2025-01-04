import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const OptionDescription = (props: Props, ref: Ref) => (
  <div
    className="col-span-2 col-start-2 row-start-2 flex flex-col truncate text-sm/5 text-zinc-500 group-data-[focus]:text-white sm:text-xs/5 dark:text-zinc-400 forced-colors:group-data-[focus]:text-[HighlightText]"
    ref={ref}
    {...props}
  />
)

export default forwardRef(OptionDescription)
