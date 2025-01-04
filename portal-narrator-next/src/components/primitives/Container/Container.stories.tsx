import type { Meta, StoryObj } from '@storybook/react'

import { Placeholder } from '../Placeholder'
import { Container, NarrowContainer } from '.'

/**
 * Container primitive component used throughout the app.
 */
const meta: Meta<typeof Container> = {
  args: {
    breakpoint: false,
    mobile: false,
  },
  argTypes: {
    breakpoint: { control: 'boolean' },
    mobile: { control: 'boolean' },
  },
  component: Container,
  decorators: [
    (Story) => (
      <div className="w-[calc(100vw-32px)] bg-gray-100">
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

export const Default: Story = {
  render: (args) => (
    <Container {...args}>
      <Placeholder size="md" />
    </Container>
  ),
}

export const Narrow: Story = {
  render: (args) => (
    <Container {...args}>
      <NarrowContainer>
        <Placeholder size="md" />
      </NarrowContainer>
    </Container>
  ),
}
