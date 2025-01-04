import { SIZES } from './constants'
import * as COLORS from './palette'

export type Color = keyof typeof COLORS
export type Size = keyof typeof SIZES

export interface IBadge {
  color?: Color
  outline?: boolean
  pill?: boolean
  size?: Size
  soft?: boolean
}
