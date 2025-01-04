import * as OutlineIcons from '@heroicons/react/24/outline'
import * as SolidIcons from '@heroicons/react/24/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Avatar, AvatarButton, AvatarDetails, AvatarDetailsButton, AvatarGroup, IAvatar, IAvatarDetails } from '.'
import { SIZES, SPREADS } from './constants'
import * as COLORS from './palette'
type Spread = keyof typeof SPREADS

type IAvatarGroup = {
  children?: React.ReactNode
  spread?: Spread
} & IAvatar

type IAvatarButton = IAvatar & React.ComponentPropsWithoutRef<'button'>
type IAvatarDetailsButton = IAvatarDetails & React.ComponentPropsWithoutRef<'button'>

const SIZES_OPTIONS = Object.keys(SIZES)
const COLORS_OPTIONS = Object.keys(COLORS)
const SPREADS_OPTIONS = Object.keys(SPREADS)
const OUTLINE_ICONS_OPTIONS = Object.keys(OutlineIcons).map((icon) => `Outline${icon}`)
const SOLID_ICONS_OPTIONS = Object.keys(SolidIcons).map((icon) => `Solid${icon}`)
const ICONS_OPTIONS = [...OUTLINE_ICONS_OPTIONS, ...SOLID_ICONS_OPTIONS]

const avatars = ['A', 'B', 'C', 'D', 'E']

/**
 * Avatar primitive component used throughout the app.
 */
const meta: Meta<IAvatar> = {
  argTypes: {
    alt: { control: 'text' },
    color: {
      control: 'select',
      options: COLORS_OPTIONS,
    },
    icon: {
      control: 'select',
      options: ICONS_OPTIONS,
    },
    initials: { control: 'text' },
    ring: { control: 'boolean' },
    size: { control: 'select', options: SIZES_OPTIONS },
    square: { control: 'boolean' },
    src: { control: 'text' },
  },
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<IAvatar>

export const Image: Story = {
  args: {
    alt: 'Mavis AI',
    color: 'transparent',
    ring: false,
    size: 'md',
    square: false,
    src: 'static/mavis/icons/logo.svg',
  },
}

export const ImageButton: StoryObj<IAvatarButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'transparent',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
    src: 'static/mavis/icons/logo.svg',
  },
  render: (args: IAvatar) => <AvatarButton {...args} />,
}

export const Initials: Story = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    initials: 'AI',
    ring: false,
    size: 'md',
    square: false,
  },
}

export const InitialsButton: StoryObj<IAvatarButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    initials: 'AI',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
  },
  render: (args: IAvatarButton) => <AvatarButton {...args} />,
}

export const OnDarkInitialsButton: StoryObj<IAvatarButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    initials: 'AI',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args: IAvatarButton) => (
    <div className="dark">
      <AvatarButton {...args} />
    </div>
  ),
}

export const InitialsGroup: StoryObj<IAvatarGroup> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    ring: true,
    size: 'md',
    spread: 'lg',
    square: false,
  },
  argTypes: {
    ...meta.argTypes,
    spread: { control: 'select', options: SPREADS_OPTIONS },
  },
  render: ({ spread, ...args }: IAvatarGroup) => (
    <AvatarGroup spread={spread}>
      {avatars.map((avatar, index) => (
        <Avatar key={index} {...args} initials={avatar} />
      ))}
    </AvatarGroup>
  ),
}

export const SolidIcon: Story = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    icon: 'SolidUserCircleIcon',
    ring: false,
    size: 'md',
    square: false,
  },
}

export const SolidIconButton: StoryObj<IAvatarButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    icon: 'SolidUserCircleIcon',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
  },
  render: (args: IAvatarButton) => <AvatarButton {...args} />,
}

export const OutlineIcon: Story = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    icon: 'OutlineUserCircleIcon',
    ring: false,
    size: 'md',
    square: false,
  },
}

export const OutlineIconButton: StoryObj<IAvatarButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    icon: 'OutlineUserCircleIcon',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
  },
  render: (args: IAvatarButton) => <AvatarButton {...args} />,
}

export const Details: StoryObj<IAvatarDetails> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    description: 'Description',
    initials: 'LD',
    label: 'Label',
    ring: false,
    size: 'md',
    square: false,
  },
  render: (args: IAvatarDetails) => <AvatarDetails {...args} />,
}

export const DetailsButton: StoryObj<IAvatarDetailsButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    description: 'Description',
    initials: 'LD',
    label: 'Label',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
  },
  render: (args: IAvatarDetailsButton) => <AvatarDetailsButton {...args} />,
}

export const OnDarkDetailsButton: StoryObj<IAvatarDetailsButton> = {
  args: {
    alt: 'Mavis AI',
    color: 'indigo',
    description: 'Description',
    initials: 'LD',
    label: 'Label',
    onClick: fn(),
    ring: false,
    size: 'md',
    square: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args: IAvatarDetailsButton) => (
    <div className="dark">
      <AvatarDetailsButton {...args} />
    </div>
  ),
}
