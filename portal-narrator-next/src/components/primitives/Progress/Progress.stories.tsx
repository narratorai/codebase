import type { Meta, StoryObj } from '@storybook/react'

import { Progress } from '.'

/**
 * Progress primitive component used throughout the app.
 */
const meta: Meta<typeof Progress> = {
  argTypes: {
    description: { control: 'text' },
    label: { control: 'text' },
    percent: { control: 'number' },
  },
  component: Progress,
  decorators: [
    (Story) => (
      <div className="min-w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    description: 'Description...',
    label: 'Label',
    percent: 37.5,
  },
}
