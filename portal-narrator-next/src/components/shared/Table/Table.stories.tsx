import type { Meta, StoryObj } from '@storybook/react'

import Table from '.'
import mockData from './mock'

/**
 * Table shared component used throughout the app.
 */
const meta: Meta<typeof Table> = {
  argTypes: {
    table: { control: 'object' },
  },
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[960px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    table: mockData,
    height: 320,
  },
}
