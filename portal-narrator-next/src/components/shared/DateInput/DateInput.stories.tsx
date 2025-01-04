import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import DateInput from '.'

const Component = () => {
  const [date, setDate] = useState<Date | null>(new Date())

  return <DateInput selected={date} onChange={setDate} />
}

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/DateInput',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Date Input',
  args: {},
}
