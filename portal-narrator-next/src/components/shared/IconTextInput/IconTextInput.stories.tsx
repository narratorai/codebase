import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { RiSearchLine } from 'react-icons/ri'

import Component from '.'

/**
 * Text Input control with prefix icon prop.
 */
const meta = {
  title: 'Components/Shared/IconTextInput',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: { onChange: fn(), onFocus: fn() },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Icon Text Input',
  args: {
    LeadingIcon: RiSearchLine,
    placeholder: 'Search...',
  },
}
