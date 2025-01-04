import clsx from 'clsx'
import { forwardRef } from 'react'

import { CROSS_AXIS, GAPS, ITEMS, MAIN_AXIS } from './constants'

type CrossAxis = keyof typeof CROSS_AXIS
type MainAxis = keyof typeof MAIN_AXIS
type Items = keyof typeof ITEMS
type Gap = keyof typeof GAPS

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  x?: CrossAxis
  y?: MainAxis
  items?: Items
  wrap?: boolean
  full?: boolean
  gap?: Gap
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Column = (
  { full = false, gap, items = 'start', wrap = false, x = 'start', y = 'start', ...props }: Props,
  ref: Ref
) => (
  <div
    className={clsx(
      'flex w-full flex-col',
      x && CROSS_AXIS[x],
      y && MAIN_AXIS[y],
      items && ITEMS[items],
      wrap && 'flex-wrap',
      full && 'h-full',
      gap && GAPS[gap]
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(Column)
