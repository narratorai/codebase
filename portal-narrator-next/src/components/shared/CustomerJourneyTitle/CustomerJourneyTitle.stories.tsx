import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/CustomerJourneyTitle',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    customerName: { control: 'text' },
    customerEmail: { control: 'text' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Customer Journey Title',
  args: {
    customerName: 'John Doe',
    customerEmail: 'customer@example.com',
  },
}

export const NoName: Story = {
  name: 'Customer Journey Title without name',
  args: {
    customerName: null,
    customerEmail: 'customer@example.com',
  },
}
