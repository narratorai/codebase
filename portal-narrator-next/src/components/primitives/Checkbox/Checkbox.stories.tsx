import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Checkbox } from '.'
import { COLORS } from './constants'

const COLORS_OPTIONS = Object.keys(COLORS)

/**
 * Checkbox primitive component used throughout the app.
 */
const meta: Meta<typeof Checkbox> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    checked: { control: 'boolean' },
    color: {
      control: 'select',
      options: COLORS_OPTIONS,
    },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'checkbox',
    value: 'checkbox1',
  },
}
