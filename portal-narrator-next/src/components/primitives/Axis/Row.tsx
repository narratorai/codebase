import clsx from 'clsx'
import { forwardRef } from 'react'

import { CROSS_AXIS, GAPS, ITEMS, MAIN_AXIS } from './constants'

type MainAxis = keyof typeof MAIN_AXIS
type CrossAxis = keyof typeof CROSS_AXIS
type Items = keyof typeof ITEMS
type Gap = keyof typeof GAPS

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  x?: MainAxis
  y?: CrossAxis
  items?: Items
  wrap?: boolean
  full?: boolean
  gap?: Gap
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Row = (
  { full = false, gap, items = 'start', wrap = false, x = 'start', y = 'start', ...props }: Props,
  ref: Ref
) => (
  <div
    className={clsx(
      'flex h-full flex-row',
      x && MAIN_AXIS[x],
      y && CROSS_AXIS[y],
      items && ITEMS[items],
      wrap && 'flex-wrap',
      full && 'w-full',
      gap && GAPS[gap]
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(Row)
