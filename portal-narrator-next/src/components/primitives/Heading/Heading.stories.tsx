import type { Meta, StoryObj } from '@storybook/react'

import { Heading, Subheading } from '.'
import { HEADING_STYLES } from './constants'
import { IHeading } from './interfaces'

const LEVEL_OPTIONS = Object.keys(HEADING_STYLES)

/**
 * Heading primitive component used throughout the app.
 */
const meta: Meta<IHeading> = {
  argTypes: {
    children: { control: 'text' },
    level: { control: 'select', options: LEVEL_OPTIONS },
  },
  component: Heading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<IHeading>

export const Head: Story = {
  args: {
    children: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz',
    level: 1,
  },
  render: (args) => <Heading {...args} />,
}

export const Subhead: Story = {
  args: {
    children: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz',
    level: 1,
  },
  render: (args) => <Subheading {...args} />,
}
