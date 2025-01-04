import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { NotificationContainer, NotificationPanel } from '.'

/**
 * Notification primitive component used throughout the app.
 */
const meta: Meta<typeof NotificationPanel> = {
  argTypes: {
    description: { control: 'text' },
    label: { control: 'text' },
    open: { control: 'boolean' },
    status: { control: 'select', options: ['success', 'info', 'warning', 'error'] },
  },
  component: NotificationPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClose: fn(),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Label',
    open: true,
  },
  render: (args) => (
    <NotificationContainer>
      <NotificationPanel {...args} />
    </NotificationContainer>
  ),
}
