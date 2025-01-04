import * as OutlineIcons from '@heroicons/react/24/outline'
import * as SolidIcons from '@heroicons/react/24/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { CheckboxIcon } from '.'
import { ICON_COLORS } from './constants'

const ICON_COLORS_OPTIONS = Object.keys(ICON_COLORS)

const OUTLINE_ICONS_OPTIONS = Object.keys(OutlineIcons)
const SOLID_ICONS_OPTIONS = Object.keys(SolidIcons)
const ICONS_OPTIONS = [...OUTLINE_ICONS_OPTIONS, ...SOLID_ICONS_OPTIONS]

/**
 * CheckboxIcon primitive component used throughout the app.
 */
const meta: Meta<typeof CheckboxIcon> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    checked: { control: 'boolean' },
    color: {
      control: 'select',
      options: ICON_COLORS_OPTIONS,
    },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    icon: { control: 'select', options: ICONS_OPTIONS },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  component: CheckboxIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: 'CheckIcon',
    name: 'checkbox',
    value: 'checkbox1',
  },
}
