import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'
import mock from './mock'

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/CustomerJourneyTimeline',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    events: { control: 'object' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Customer Journey Timeline',
  args: {
    events: mock,
  },
}
