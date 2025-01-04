import clsx from 'clsx'

import { SIZES, WEIGHTS } from './constants'
import { ArbitraryColor, Color, Size, Weight } from './interfaces'
import * as COLORS from './palette'

type Props = {
  color?: Color | ArbitraryColor
  size?: Size
  weight?: Weight
} & Omit<React.ComponentPropsWithoutRef<'p'>, 'className'>

const Text = ({ color = 'zinc', size = 'md', weight = 'md', ...props }: Props) => {
  const colorVariable = color in COLORS ? COLORS[color as Color] : undefined
  const colorValue = colorVariable ? undefined : color
  return (
    <p
      {...props}
      className={clsx('text-[--light-base] dark:text-[--dark-base]', colorVariable, SIZES[size], WEIGHTS[weight])}
      data-slot="text"
      style={{ color: colorValue }}
    />
  )
}

export default Text
