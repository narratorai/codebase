import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Switch } from '.'

/**
 * Switch primitive component used throughout the app.
 */
const meta: Meta<typeof Switch> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    checked: { control: 'boolean' },
    color: {
      control: 'select',
      options: [
        'dark/zinc',
        'dark/white',
        'dark',
        'zinc',
        'white',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
      ],
    },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    color: 'dark/zinc',
    defaultChecked: false,
    disabled: false,
    name: 'switch',
    value: 'switch',
  },
}
