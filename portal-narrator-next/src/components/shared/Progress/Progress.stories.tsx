import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'

const Progress = (props: { percent: number; orientation?: 'horizontal' | 'vertical' }) => (
  <div className="flex h-96 w-96 items-center justify-center">
    <Component {...props} />
  </div>
)

/**
 * Progress Bar.
 */
const meta = {
  title: 'Components/Shared/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    percent: { control: 'number' },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  name: 'Horizontal Bar',
  args: {
    percent: 50,
  },
}

export const Vertical: Story = {
  name: 'Vertical Bar',
  args: {
    percent: 50,
    orientation: 'vertical',
  },
}
