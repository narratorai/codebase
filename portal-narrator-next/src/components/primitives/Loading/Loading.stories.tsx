import type { Meta, StoryObj } from '@storybook/react'

import Loading from '.'
import { SIZES } from './constants'

const SIZES_OPTIONS = Object.keys(SIZES)

/**
 * Loading primitive component used throughout the app.
 */
const meta: Meta<typeof Loading> = {
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: SIZES_OPTIONS },
  },
  component: Loading,
  decorators: [
    (Story) => (
      <div className="w-[calc(100vw-32px)]">
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
    label: 'Loading',
    size: 'md',
  },
}
