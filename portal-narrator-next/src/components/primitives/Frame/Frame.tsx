import clsx from 'clsx'
import { forwardRef } from 'react'

import { FRAMES } from './constants'

type Ref = React.ForwardedRef<HTMLDivElement>

type Frames = keyof typeof FRAMES

type Props = {
  all?: Frames
  x?: Frames
  y?: Frames
  top?: Frames
  bottom?: Frames
  left?: Frames
  right?: Frames
  dark?: boolean
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Frame = ({ all, bottom, dark, left, right, top, x, y, ...props }: Props, ref: Ref) => (
  <div
    className={clsx(
      all && FRAMES[all]['all'],
      x && FRAMES[x]['x'],
      y && FRAMES[y]['y'],
      top && FRAMES[top]['top'],
      bottom && FRAMES[bottom]['bottom'],
      left && FRAMES[left]['left'],
      right && FRAMES[right]['right'],
      dark && 'dark'
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(Frame)
