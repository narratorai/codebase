import { ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import React from 'react'

import { Link } from '../Link'
import { CIRCLE_BUTTON_SIZES, ICON_BUTTON_SIZES, PILL_BUTTON_SIZES, RECTANGLE_BUTTON_SIZES } from './constants'

type BaseButtonProps =
  | Omit<HeadlessButtonProps, 'as' | 'className'>
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>

export type RectangleButtonSize = keyof typeof RECTANGLE_BUTTON_SIZES
export type IconButtonSize = keyof typeof ICON_BUTTON_SIZES
export type PillButtonSize = keyof typeof PILL_BUTTON_SIZES
export type CircleButtonSize = keyof typeof CIRCLE_BUTTON_SIZES

interface IRectangleButton {
  circle?: never
  icon?: never
  pill?: never
  size?: RectangleButtonSize
}

interface IIconButton {
  circle?: never
  icon: true
  pill?: never
  size?: IconButtonSize
}

interface IPillButton {
  circle?: never
  icon?: never
  pill: true
  size?: PillButtonSize
}

interface ICircleButton {
  circle: true
  icon?: never
  pill?: never
  size?: CircleButtonSize
}

interface IButtonColor {
  outline?: boolean
  plain?: boolean
}

type IButtonSize = IRectangleButton | IIconButton | IPillButton | ICircleButton

export type IButton = {
  label?: string
  children: React.ReactNode
} & BaseButtonProps &
  IButtonColor &
  IButtonSize

export type ISelectButton<T> = {
  value?: T
  placeholder?: React.ReactNode
  displayValue?: (value: T) => React.ReactNode
} & IButtonColor &
  Omit<HeadlessButtonProps, 'as' | 'className'>
