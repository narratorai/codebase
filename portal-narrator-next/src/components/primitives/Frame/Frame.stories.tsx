import type { Meta, StoryObj } from '@storybook/react'

import { Placeholder } from '../Placeholder'
import { Frame } from '.'
import { FRAMES } from './constants'

const FRAMES_OPTIONS = Object.keys(FRAMES)

/**
 * Frame (layout) primitive component used throughout the app.
 */
const meta: Meta<typeof Frame> = {
  argTypes: {
    all: { control: 'select', options: FRAMES_OPTIONS },
    bottom: { control: 'select', options: FRAMES_OPTIONS },
    left: { control: 'select', options: FRAMES_OPTIONS },
    right: { control: 'select', options: FRAMES_OPTIONS },
    top: { control: 'select', options: FRAMES_OPTIONS },
    x: { control: 'select', options: FRAMES_OPTIONS },
    y: { control: 'select', options: FRAMES_OPTIONS },
  },
  component: Frame,
  decorators: [
    (Story) => (
      <div className="w-[calc(100vw-32px)] bg-gray-200">
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
  render: (args) => (
    <Frame {...args}>
      <Placeholder size="lg" />
    </Frame>
  ),
}
