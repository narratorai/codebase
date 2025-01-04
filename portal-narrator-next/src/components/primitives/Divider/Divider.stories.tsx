import type { Meta, StoryObj } from '@storybook/react'

import { Divider } from '.'

/**
 * Divider primitive component used throughout the app.
 */
const meta: Meta<typeof Divider> = {
  argTypes: {
    soft: { control: 'boolean' },
  },
  component: Divider,
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
  args: {},
}
