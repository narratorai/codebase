import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLParagraphElement>

type Props = Omit<React.ComponentPropsWithoutRef<'p'>, 'className'>

const SearchboxItemTitle = (props: Props, ref: Ref) => (
  <p className="text-sm font-medium text-gray-700 group-data-[focus]:text-gray-900" ref={ref} {...props} />
)

export default forwardRef(SearchboxItemTitle)
