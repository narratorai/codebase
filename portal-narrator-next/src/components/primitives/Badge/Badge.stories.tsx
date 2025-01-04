import { ArrowUpIcon } from '@heroicons/react/24/outline'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Badge, BadgeButton, BadgeRemoveButton } from '.'
import { SIZES } from './constants'
import * as COLORS from './palette'

const COLORS_OPTIONS = Object.keys(COLORS)
const SIZES_OPTIONS = Object.keys(SIZES)

/**
 * Badge primitive component used throughout the app.
 */
const meta: Meta<typeof Badge> = {
  args: {
    children: 'Badge',
  },
  argTypes: {
    color: {
      control: 'select',
      options: COLORS_OPTIONS,
    },
    outline: { control: 'boolean' },
    pill: { control: 'boolean' },
    size: { control: 'select', options: SIZES_OPTIONS },
    soft: { control: 'boolean' },
    children: { control: 'text' },
  },
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta

export const Solid: StoryObj<typeof Badge> = {
  render: (args) => <Badge {...args} />,
}

export const Soft: StoryObj<typeof Badge> = {
  args: {
    soft: true,
  },
  render: (args) => <Badge {...args} />,
}

export const Outline: StoryObj<typeof Badge> = {
  args: {
    outline: true,
  },
  render: (args) => <Badge {...args} />,
}

export const SolidPill: StoryObj<typeof Badge> = {
  args: {
    pill: true,
  },
  render: (args) => <Badge {...args} />,
}

export const SoftPill: StoryObj<typeof Badge> = {
  args: {
    pill: true,
    soft: true,
  },
  render: (args) => <Badge {...args} />,
}

export const OutlinePill: StoryObj<typeof Badge> = {
  args: {
    outline: true,
    pill: true,
  },
  render: (args) => <Badge {...args} />,
}

export const SolidWithLeadingIcon: StoryObj<typeof Badge> = {
  render: ({ children, ...args }) => (
    <Badge {...args}>
      <ArrowUpIcon />
      {children}
    </Badge>
  ),
}

export const SolidWithTrailingIcon: StoryObj<typeof Badge> = {
  render: ({ children, ...args }) => (
    <Badge {...args}>
      {children}
      <ArrowUpIcon />
    </Badge>
  ),
}

export const AsButton: StoryObj<typeof BadgeButton> = {
  args: {
    ...meta.args,
    onClick: fn(),
    children: 'Badge',
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
  render: (args) => <BadgeButton {...args} />,
}

export const OnDarkAsButton: StoryObj<typeof BadgeButton> = {
  args: {
    ...meta.args,
    onClick: fn(),
    children: 'Badge',
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args) => (
    <div className="dark">
      <BadgeButton {...args} />
    </div>
  ),
}

export const WithRemoveButton: StoryObj<typeof BadgeRemoveButton> = {
  args: {
    ...meta.args,
    onClick: fn(),
    children: 'Badge',
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
  render: (args) => <BadgeRemoveButton {...args} />,
}

export const OnDarkWithRemoveButton: StoryObj<typeof BadgeRemoveButton> = {
  args: {
    ...meta.args,
    onClick: fn(),
    children: 'Badge',
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args) => (
    <div className="dark">
      <BadgeRemoveButton {...args} />
    </div>
  ),
}
