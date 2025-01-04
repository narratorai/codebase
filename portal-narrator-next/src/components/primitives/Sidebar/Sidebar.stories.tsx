/* eslint-disable react/jsx-max-depth */
import {
  ArrowPathRoundedSquareIcon,
  BoltIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  HomeIcon,
  LifebuoyIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '.'

const Component = () => {
  const [current, setCurrent] = useState<string>('chat')

  return (
    <div className="h-[512px]">
      <Sidebar>
        <SidebarHeader>
          <SidebarItem href="/home">
            <HomeIcon />
            <SidebarLabel>Home</SidebarLabel>
          </SidebarItem>
        </SidebarHeader>
        <SidebarBody>
          <SidebarSection>
            <SidebarItem current={current === 'chat'} href="/chat" onClick={() => setCurrent('chat')}>
              <ChatBubbleLeftRightIcon />
              <SidebarLabel>Mavis AI</SidebarLabel>
            </SidebarItem>

            <SidebarItem current={current === 'datasets'} href="/datasets" onClick={() => setCurrent('datasets')}>
              <TableCellsIcon />
              <SidebarLabel>Visual query</SidebarLabel>
            </SidebarItem>

            <SidebarItem
              current={current === 'customer-journey'}
              href="/customer-journey"
              onClick={() => setCurrent('customer-journey')}
            >
              <ArrowPathRoundedSquareIcon />
              <SidebarLabel>Customer journey</SidebarLabel>
            </SidebarItem>

            <SidebarItem current={current === 'activities'} href="/activities" onClick={() => setCurrent('activities')}>
              <BoltIcon />
              <SidebarLabel>Activities</SidebarLabel>
            </SidebarItem>

            <SidebarItem current={current === 'dashboards'} href="/dashboards" onClick={() => setCurrent('dashboards')}>
              <ChartPieIcon />
              <SidebarLabel>Dashboards</SidebarLabel>
            </SidebarItem>

            <SidebarDivider />

            <SidebarHeading>Heading</SidebarHeading>
            <SidebarItem
              current={current === 'transformations'}
              href="/transformations"
              onClick={() => setCurrent('transformations')}
            >
              <CpuChipIcon />
              <SidebarLabel>Transformations</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
          <SidebarSpacer />
        </SidebarBody>
        <SidebarFooter>
          <SidebarItem href="/support">
            <LifebuoyIcon />
            <SidebarLabel>Support</SidebarLabel>
          </SidebarItem>
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}

/**
 * Sidebar primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OnDark: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args) => (
    <div className="dark">
      <Component {...args} />
    </div>
  ),
}
