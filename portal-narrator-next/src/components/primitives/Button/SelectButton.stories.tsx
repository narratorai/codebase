import type { Meta, StoryObj } from '@storybook/react'

import { SingleSelectButton } from '.'

interface Value {
  id: string
  label: string
}

/**
 * Single Select Button (Trigger) primitive component used throughout the app.
 */
const meta: Meta<typeof SingleSelectButton<Value>> = {
  args: {
    displayValue: (value: Value) => value.label,
  },
  argTypes: {
    outline: { control: 'boolean' },
    placeholder: { control: 'text' },
    plain: { control: 'boolean' },
    value: { control: 'object' },
  },
  component: SingleSelectButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Select option...',
  },
}

export const WithValue: StoryObj<{ value: Value }> = {
  args: {
    value: {
      id: 'option1',
      label: 'Option 1',
    },
  },
}
