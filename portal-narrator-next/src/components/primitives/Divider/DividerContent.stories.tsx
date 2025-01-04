import { PlusIcon } from '@heroicons/react/20/solid'
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../Button'
import { DividerContent, DividerItem, DividerLabel, DividerTitle } from '.'

/**
 * Divider (with content) primitive component used throughout the app.
 */
const meta: Meta<typeof DividerContent> = {
  argTypes: {
    children: { control: 'text' },
    soft: { control: 'boolean' },
  },
  component: DividerContent,
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

export const TitleCenter: Story = {
  args: {
    children: 'Title',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args}>
      <DividerTitle>{children}</DividerTitle>
    </DividerContent>
  ),
}

export const TitleLeft: Story = {
  args: {
    children: 'Title',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="left">
      <DividerTitle position="left">{children}</DividerTitle>
    </DividerContent>
  ),
}

export const TitleRight: Story = {
  args: {
    children: 'Title',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="right">
      <DividerTitle position="right">{children}</DividerTitle>
    </DividerContent>
  ),
}

export const LabelCenter: Story = {
  args: {
    children: 'Label',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args}>
      <DividerLabel>{children}</DividerLabel>
    </DividerContent>
  ),
}

export const LabelLeft: Story = {
  args: {
    children: 'Label',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="left">
      <DividerLabel position="left">{children}</DividerLabel>
    </DividerContent>
  ),
}

export const LabelRight: Story = {
  args: {
    children: 'Label',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="right">
      <DividerLabel position="right">{children}</DividerLabel>
    </DividerContent>
  ),
}

export const IconCenter: Story = {
  args: {
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args}>
      <DividerItem padding="sm">
        <PlusIcon aria-hidden="true" className="h-5 w-5 text-gray-500" />
      </DividerItem>
    </DividerContent>
  ),
}

export const IconLeft: Story = {
  args: {
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="left">
      <DividerItem padding="sm" position="left">
        <PlusIcon aria-hidden="true" className="h-5 w-5 text-gray-500" />
      </DividerItem>
    </DividerContent>
  ),
}

export const IconRight: Story = {
  args: {
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="right">
      <DividerItem padding="sm" position="right">
        <PlusIcon aria-hidden="true" className="h-5 w-5 text-gray-500" />
      </DividerItem>
    </DividerContent>
  ),
}

export const ButtonCenter: Story = {
  args: {
    children: 'Button',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args}>
      <DividerItem>
        <Button outline>{children}</Button>
      </DividerItem>
    </DividerContent>
  ),
}

export const ButtonLeft: Story = {
  args: {
    children: 'Button',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="left">
      <DividerItem position="left">
        <Button outline>{children}</Button>
      </DividerItem>
    </DividerContent>
  ),
}

export const ButtonRight: Story = {
  args: {
    children: 'Button',
    soft: false,
  },
  render: ({ children, ...args }) => (
    <DividerContent {...args} content="right">
      <DividerItem position="right">
        <Button outline>{children}</Button>
      </DividerItem>
    </DividerContent>
  ),
}

export const TitleLeftButtonRight: Story = {
  args: {
    soft: false,
  },
  render: (args) => (
    <DividerContent {...args} content="between">
      <DividerTitle position="left">Title</DividerTitle>
      <DividerItem position="right">
        <Button outline>Button</Button>
      </DividerItem>
    </DividerContent>
  ),
}
