import clsx from 'clsx'
import { forwardRef } from 'react'

import { SPREADS } from './constants'

type Ref = React.ForwardedRef<HTMLDivElement>
type Spread = keyof typeof SPREADS

interface Props extends Omit<React.ComponentPropsWithoutRef<'div'>, 'className'> {
  spread?: Spread
}

const AvatarGroup = ({ spread = 'md', ...props }: Props, ref: Ref) => (
  <div className={clsx('flex overflow-hidden p-1', SPREADS[spread])} ref={ref} {...props} />
)

export default forwardRef(AvatarGroup)
