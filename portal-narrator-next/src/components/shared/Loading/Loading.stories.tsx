import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'

/**
 * Loading Animation, Mavis Logo of proportions (width:height) 4:3.
 */
const meta = {
  title: 'Components/Shared/Loading',
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
  name: 'Loading Animation',
  args: {
    className: '',
  },
}
