import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'

/**
 * Spinning Animation, Loading icon.
 */
const meta = {
  title: 'Components/Shared/Spin',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Spinning Animation',
  args: {
    className: '',
  },
}
