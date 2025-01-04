import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'
import mock from './mock'

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/CustomerJourney',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    events: { control: 'object' },
    attributes: { control: 'object' },
    config: { control: 'object' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Customer Journey',
  args: {
    ...mock,
  },
}
