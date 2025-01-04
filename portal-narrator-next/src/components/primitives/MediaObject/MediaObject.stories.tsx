import type { Meta, StoryObj } from '@storybook/react'

import { COLORS } from '../Avatar'
import { MediaObject } from '.'

const COLORS_OPTIONS = Object.keys(COLORS)

/**
 * Media Object primitive component used throughout the app.
 */
const meta: Meta<typeof MediaObject> = {
  argTypes: {
    align: { control: 'select', options: ['top', 'center', 'bottom'] },
    alt: { control: 'text' },
    color: {
      control: 'select',
      options: COLORS_OPTIONS,
    },
    description: { control: 'text' },
    initials: { control: 'text' },
    label: { control: 'text' },
    ring: { control: 'boolean' },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    square: { control: 'boolean' },
    src: { control: 'text' },
  },
  component: MediaObject,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    align: 'top',
    color: 'transparent',
    description: 'Description',
    initials: 'AV',
    label: 'Label',
    ring: false,
    size: 'xl',
    square: false,
  },
}

export const OnDark: Story = {
  args: {
    align: 'top',
    color: 'transparent',
    description: 'Description',
    initials: 'AV',
    label: 'Label',
    ring: false,
    size: 'xl',
    square: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args) => (
    <div className="dark">
      <MediaObject {...args} />
    </div>
  ),
}
