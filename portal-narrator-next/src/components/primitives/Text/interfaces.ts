import { SIZES, WEIGHTS } from './constants'
import * as COLORS from './palette'

export type Color = keyof typeof COLORS
export type Size = keyof typeof SIZES
export type Weight = keyof typeof WEIGHTS
export type ArbitraryColor = string
