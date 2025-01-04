import type { Meta, StoryObj } from '@storybook/react'

import { Link } from '.'

/**
 * Link primitive component, used by other primitives.
 */
const meta: Meta<typeof Link> = {
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
  },
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Link',
    href: 'https://portal.narrator.ai/',
  },
}
