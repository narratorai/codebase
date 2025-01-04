import type { Meta, StoryObj } from '@storybook/react'

import { Code, Strong, Text, TextLink } from '.'
import { SIZES, WEIGHTS } from './constants'

type TextProps = React.ComponentPropsWithoutRef<typeof Text>
type TextLinkProps = React.ComponentPropsWithoutRef<typeof TextLink>
type StrongProps = React.ComponentPropsWithoutRef<typeof Strong>
type CodeProps = React.ComponentPropsWithoutRef<typeof Code>

const SIZES_OPTIONS = Object.keys(SIZES)
const WEIGHTS_OPTIONS = Object.keys(WEIGHTS)
/**
 * Text primitive component with used throughout the app.
 */
const meta: Meta<typeof Text> = {
  argTypes: {
    children: { control: 'text' },
    color: { control: 'text' },
    size: { control: 'select', options: SIZES_OPTIONS },
    weight: { control: 'select', options: WEIGHTS_OPTIONS },
  },
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta

export const PlainText: StoryObj<TextProps> = {
  args: {
    children: 'This text is plain.',
  },
}

export const OnDarkPlainText: StoryObj<TextProps> = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  args: {
    children: 'This text is plain.',
  },
  render: (args) => (
    <div className="dark">
      <Text {...args} />
    </div>
  ),
}

export const LinkText: StoryObj<TextLinkProps & TextProps> = {
  args: {
    children: 'This text is link.',
    href: 'https://narrator.ai/',
    target: '_blank',
  },
  render: ({ color, size, weight, ...args }) => (
    <Text color={color} size={size} weight={weight}>
      <TextLink {...args} />
    </Text>
  ),
}

export const OnDarkLinkText: StoryObj<TextLinkProps & TextProps> = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  args: {
    children: 'This text is link.',
    href: 'https://narrator.ai/',
    target: '_blank',
  },
  render: ({ color, size, weight, ...args }) => (
    <div className="dark">
      <Text color={color} size={size} weight={weight}>
        <TextLink {...args} />
      </Text>
    </div>
  ),
}

export const StrongText: StoryObj<StrongProps & TextProps> = {
  args: {
    children: 'This text is bold.',
  },
  render: ({ color, size, weight, ...args }) => (
    <Text color={color} size={size} weight={weight}>
      <Strong {...args} />
    </Text>
  ),
}

export const OnDarkStrongText: StoryObj<StrongProps & TextProps> = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  args: {
    children: 'This text is bold.',
  },
  render: ({ color, size, weight, ...args }) => (
    <div className="dark">
      <Text color={color} size={size} weight={weight}>
        <Strong {...args} />
      </Text>
    </div>
  ),
}

export const CodeText: StoryObj<CodeProps & TextProps> = {
  args: {
    children: 'This text is code.',
  },
  render: ({ color, size, weight, ...args }) => (
    <Text color={color} size={size} weight={weight}>
      <Code {...args} />
    </Text>
  ),
}

export const OnDarkCodeText: StoryObj<CodeProps & TextProps> = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  args: {
    children: 'This text is code.',
  },
  render: ({ color, size, weight, ...args }) => (
    <div className="dark">
      <Text color={color} size={size} weight={weight}>
        <Code {...args} />
      </Text>
    </div>
  ),
}

export const CompositeText: StoryObj<CodeProps & StrongProps & TextLinkProps & TextProps> = {
  render: (args) => (
    <div className="w-[calc(100vw-32px)]">
      <Text {...args}>
        Lorem ipsum dolor sit amet, <TextLink href="https://narrator.ai/">consectetur adipiscing elit</TextLink> sed do
        eiusmod <Strong>tempor incididunt </Strong> ut labore <Code>et dolore magna aliqua</Code>.
      </Text>
    </div>
  ),
}

export const OnDarkCompositeText: StoryObj<CodeProps & StrongProps & TextLinkProps & TextProps> = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args) => (
    <div className="dark w-[calc(100vw-32px)]">
      <Text {...args}>
        Lorem ipsum dolor sit amet, <TextLink href="https://narrator.ai/">consectetur adipiscing elit</TextLink> sed do
        eiusmod <Strong>tempor incididunt </Strong> ut labore <Code>et dolore magna aliqua</Code>.
      </Text>
    </div>
  ),
}
