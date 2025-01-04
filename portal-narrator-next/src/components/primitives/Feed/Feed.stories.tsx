/* eslint-disable react/jsx-max-depth */
import type { Meta, StoryObj } from '@storybook/react'

import { Avatar } from '../Avatar'
import {
  Feed,
  FeedItem,
  FeedItemCard,
  FeedItemCircle,
  FeedItemDot,
  FeedItemLabel,
  FeedItemRow,
  FeedItemText,
  FeedItemTime,
  FeedItemTitle,
} from '.'

/**
 * Template Component description visible in the storybook.
 */
const meta: Meta<typeof Feed> = {
  component: Feed,
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

export const Default: Story = {
  render: () => (
    <Feed>
      <FeedItem>
        <FeedItemCircle>
          <FeedItemDot />
        </FeedItemCircle>
        <FeedItemLabel>
          <FeedItemTitle>Chelsea Hagon</FeedItemTitle> created the invoice.
        </FeedItemLabel>
        <FeedItemTime dateTime="2023-01-23T10:32">7d ago</FeedItemTime>
      </FeedItem>

      <FeedItem>
        <FeedItemCircle>
          <FeedItemDot />
        </FeedItemCircle>
        <FeedItemLabel>
          <FeedItemTitle>Chelsea Hagon</FeedItemTitle> edited the invoice.
        </FeedItemLabel>
        <FeedItemTime dateTime="2023-01-23T11:03">6d ago</FeedItemTime>
      </FeedItem>

      <FeedItem>
        <FeedItemCircle>
          <FeedItemDot />
        </FeedItemCircle>
        <FeedItemLabel>
          <FeedItemTitle>Chelsea Hagon</FeedItemTitle> sent the invoice.
        </FeedItemLabel>
        <FeedItemTime dateTime="2023-01-23T11:24">6d ago</FeedItemTime>
      </FeedItem>

      <FeedItem>
        <FeedItemCircle>
          <Avatar
            color="indigo"
            size="sm"
            src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          />
        </FeedItemCircle>
        <FeedItemCard>
          <FeedItemRow>
            <FeedItemLabel>
              <FeedItemTitle>Chelsea Hagon</FeedItemTitle> commented.
            </FeedItemLabel>
            <FeedItemTime dateTime="2023-01-23T15:56">3d ago</FeedItemTime>
          </FeedItemRow>
          <FeedItemText>Called client, they reassured me the invoice would be paid by the 25th.</FeedItemText>
        </FeedItemCard>
      </FeedItem>

      <FeedItem>
        <FeedItemCircle>
          <FeedItemDot />
        </FeedItemCircle>
        <FeedItemLabel>
          <FeedItemTitle>Alex Curren</FeedItemTitle> viewed the invoice.
        </FeedItemLabel>
        <FeedItemTime dateTime="2023-01-24T09:12">2d ago</FeedItemTime>
      </FeedItem>

      <FeedItem last>
        <FeedItemCircle>
          <Avatar color="indigo" icon="SolidCheckCircleIcon" size="sm" />
        </FeedItemCircle>
        <FeedItemLabel>
          <FeedItemTitle>Alex Curren</FeedItemTitle> paid the invoice.
        </FeedItemLabel>
        <FeedItemTime dateTime="2023-01-24T09:20">1d ago</FeedItemTime>
      </FeedItem>
    </Feed>
  ),
}
