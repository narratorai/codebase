import { CheckboxProps } from '@headlessui/react'
import * as OutlineIcons from '@heroicons/react/24/outline'
import * as SolidIcons from '@heroicons/react/24/solid'

import { COLORS, ICON_COLORS } from './constants'

export type Color = keyof typeof COLORS
export type IconColor = keyof typeof ICON_COLORS
export type Icon = keyof typeof OutlineIcons | keyof typeof SolidIcons

export type HeadlessCheckboxProps = Omit<CheckboxProps, 'as' | 'className'>
