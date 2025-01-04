import type { Meta, StoryObj } from '@storybook/react'

import EmptyState from '.'

/**
 * Empty State primitive component used throughout the app.
 */
const meta: Meta<typeof EmptyState> = {
  argTypes: {
    description: { control: 'text' },
    title: { control: 'text' },
  },
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    description: 'No items found for this search term. Please try again.',
    title: 'No results found',
  },
}
