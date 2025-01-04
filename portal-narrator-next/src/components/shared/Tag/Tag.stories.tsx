import type { Meta, StoryObj } from '@storybook/react'

import { Label, Tag } from '.'

interface Props {
  size: 'sm' | 'md' | 'lg'
  color: 'transparent' | 'white' | 'green' | 'red' | 'purple' | 'yellow' | 'blue' | 'pink' | 'pink-purple' | 'gray'
  border: boolean
  children: React.ReactNode
}

const Component = ({ size, color, border, children }: Props) => (
  <Tag size={size} color={color} border={border}>
    <Label>{children}</Label>
  </Tag>
)

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/Tag',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'radio',
      options: ['transparent', 'white', 'green', 'red', 'purple', 'yellow', 'blue', 'pink', 'pink-purple', 'gray'],
    },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    border: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Tag',
  args: {
    size: 'lg',
    color: 'transparent',
    border: false,
    children: 'Tag Content',
  },
}
