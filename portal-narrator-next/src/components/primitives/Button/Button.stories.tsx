import { PlusIcon } from '@heroicons/react/20/solid'
import { ArrowDownCircleIcon } from '@heroicons/react/24/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '.'
import { ICON_BUTTON_SIZES, RECTANGLE_BUTTON_SIZES } from './constants'
import { IButton } from './interfaces'

const SIZES_OPTIONS = Object.keys(RECTANGLE_BUTTON_SIZES)
const ICON_SIZES_OPTIONS = Object.keys(ICON_BUTTON_SIZES)
/**
 * Button primitive component used throughout the app.
 */
const meta: Meta<IButton> = {
  args: {
    onClick: fn(),
  },
  argTypes: {
    children: { control: 'text' },
    circle: { control: 'boolean' },
    disabled: { control: 'boolean' },
    href: { control: 'text' },
    icon: { control: 'boolean' },
    outline: { control: 'boolean' },
    pill: { control: 'boolean' },
    plain: { control: 'boolean' },
    size: {
      control: 'select',
      options: SIZES_OPTIONS,
    },
  },
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<IButton>

export const Solid: Story = {
  args: {
    children: 'Button',
  },
}

export const Outline: Story = {
  args: {
    children: 'Button',
    outline: true,
  },
}

export const Plain: Story = {
  args: {
    children: 'Button',
    plain: true,
  },
}

export const SolidWithIcon: Story = {
  args: {
    children: 'Button',
  },
  render: ({ children, ...args }: IButton) => (
    <Button {...args}>
      <PlusIcon />
      {children}
    </Button>
  ),
}

export const SolidWithIconOnly: Story = {
  args: {
    children: 'Button',
  },
  render: (args: IButton) => (
    <Button {...args}>
      <PlusIcon />
    </Button>
  ),
}

export const Icon: Story = {
  args: {
    children: 'Button',
    icon: true,
    size: 'xl',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ICON_SIZES_OPTIONS,
    },
  },
  render: (args: IButton) => (
    <Button {...args}>
      <ArrowDownCircleIcon />
    </Button>
  ),
}
