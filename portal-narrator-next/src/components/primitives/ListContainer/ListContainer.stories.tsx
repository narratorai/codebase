import type { Meta, StoryObj } from '@storybook/react'

import { Placeholder } from '../Placeholder'
import { ListContainer, ListContainerItem } from '.'

/**
 * List Container primitive component used throughout the app.
 */
const meta: Meta<typeof ListContainer> = {
  component: ListContainer,
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

export const Simple: Story = {
  render: () => (
    <ListContainer>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const SimpleSeparated: Story = {
  render: () => (
    <ListContainer list="separated">
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const SimpleDivided: Story = {
  render: () => (
    <ListContainer list="divided">
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem>
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const CardDivided: Story = {
  render: () => (
    <ListContainer card="regular" list="divided">
      <ListContainerItem item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const MobileCardDivided: Story = {
  render: () => (
    <ListContainer card="regular-mobile" list="divided">
      <ListContainerItem item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const FlatCardDivided: Story = {
  render: () => (
    <ListContainer card="flat" list="divided">
      <ListContainerItem item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const MobileFlatCardDivided: Story = {
  render: () => (
    <ListContainer card="flat-mobile" list="divided">
      <ListContainerItem item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const SeparateCards: Story = {
  render: () => (
    <ListContainer list="separated">
      <ListContainerItem card="regular" item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem card="regular" item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem card="regular" item="padded">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const MobileSeparateCards: Story = {
  render: () => (
    <ListContainer list="separated">
      <ListContainerItem card="regular-mobile" item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem card="regular-mobile" item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem card="regular-mobile" item="padded-mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}

export const SimpleMobileDivided: Story = {
  render: () => (
    <ListContainer list="divided">
      <ListContainerItem item="mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
      <ListContainerItem item="mobile">
        <Placeholder size="sm" />
      </ListContainerItem>
    </ListContainer>
  ),
}
