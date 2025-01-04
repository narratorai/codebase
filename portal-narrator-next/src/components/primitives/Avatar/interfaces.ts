import * as OutlineIcons from '@heroicons/react/24/outline'
import * as SolidIcons from '@heroicons/react/24/solid'

import { SIZES } from './constants'
import * as COLORS from './palette'

export type SolidIcon = keyof typeof SolidIcons
export type OutlineIcon = keyof typeof OutlineIcons

export type PrefixedSolidIcons = {
  [K in SolidIcon as `Solid${K}`]: K
}

export type PrefixedOutlineIcons = {
  [K in OutlineIcon as `Outline${K}`]: K
}

export type Size = keyof typeof SIZES
export type Color = keyof typeof COLORS
export type Icon = keyof PrefixedSolidIcons | keyof PrefixedOutlineIcons

export interface IAvatar {
  alt?: string
  color?: Color
  icon?: Icon
  initials?: string
  ring?: boolean
  size?: Size
  square?: boolean
  src?: string | null
}

export interface IAvatarDetails extends IAvatar {
  description?: string
  label?: string
}
