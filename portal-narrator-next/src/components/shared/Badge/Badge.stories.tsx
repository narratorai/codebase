import type { Meta, StoryObj } from '@storybook/react'

import { Badge, Label } from '.'

interface Props {
  size: 'sm' | 'md'
  color: 'green' | 'red' | 'purple' | 'yellow' | 'blue' | 'pink' | 'pink-purple' | 'gray'
  appearance: 'filled' | 'tonal' | 'outlined'
  children: React.ReactNode
}

const Component = ({ size, color, appearance, children }: Props) => (
  <Badge size={size} color={color} appearance={appearance}>
    <Label>{children}</Label>
  </Badge>
)

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/Badge',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'radio',
      options: ['green', 'red', 'purple', 'yellow', 'blue', 'pink', 'pink-purple', 'gray'],
    },
    size: { control: 'radio', options: ['sm', 'md'] },
    appearance: { control: 'radio', options: ['filled', 'tonal', 'outlined'] },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Badge',
  args: {
    size: 'md',
    color: 'green',
    appearance: 'filled',
    children: 'Badge label',
  },
}
