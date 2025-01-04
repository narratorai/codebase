import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import Select from '.'

/**
 * Select primitive component used throughout the app.
 */
const meta: Meta<typeof Select> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    'aria-label': { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    multiple: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    'aria-label': 'Select option',
    name: 'select',
  },
  render: (args) => (
    <Select {...args}>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </Select>
  ),
}
