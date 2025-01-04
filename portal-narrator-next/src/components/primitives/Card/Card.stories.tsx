import type { Meta, StoryObj } from '@storybook/react'

import { Placeholder } from '../Placeholder'
import { Card, CardBody, CardFooter, CardHeader } from '.'

/**
 * Card primitive component used throughout the app.
 */
const meta: Meta<typeof Card> = {
  args: {
    mobile: false,
  },
  argTypes: {
    mobile: { control: 'boolean' },
  },
  component: Card,
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
type Story = StoryObj<typeof Card>

export const Body: Story = {
  render: (args) => (
    <Card {...args}>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
    </Card>
  ),
}

export const Well: Story = {
  render: (args) => (
    <Card {...args} well>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
    </Card>
  ),
}

export const GrayWell: Story = {
  render: (args) => (
    <Card {...args} gray well>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
    </Card>
  ),
}

export const WithHeader: Story = {
  render: (args) => (
    <Card {...args} divided>
      <CardHeader>
        <Placeholder size="xs" />
      </CardHeader>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
    </Card>
  ),
}

export const WithGrayHeader: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader gray>
        <Placeholder size="xs" />
      </CardHeader>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args} divided>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
      <CardFooter>
        <Placeholder size="xs" />
      </CardFooter>
    </Card>
  ),
}

export const WithGrayFooter: Story = {
  render: (args) => (
    <Card {...args}>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
      <CardFooter gray>
        <Placeholder size="xs" />
      </CardFooter>
    </Card>
  ),
}

export const WithHeaderAndFooter: Story = {
  render: (args) => (
    <Card {...args} divided>
      <CardHeader>
        <Placeholder size="xs" />
      </CardHeader>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
      <CardFooter>
        <Placeholder size="xs" />
      </CardFooter>
    </Card>
  ),
}

export const WithGrayHeaderAndFooter: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader gray>
        <Placeholder size="xs" />
      </CardHeader>
      <CardBody>
        <Placeholder size="lg" />
      </CardBody>
      <CardFooter gray>
        <Placeholder size="xs" />
      </CardFooter>
    </Card>
  ),
}
