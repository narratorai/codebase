import {
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  LifebuoyIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '../Sidebar'
import { SidebarLayout } from '.'

const SidebarMenu = ({ current, setCurrent, setExpand }: any) => (
  <Sidebar>
    <SidebarBody>
      <SidebarSection>
        <SidebarItem onClick={setExpand}>
          <ArrowsRightLeftIcon />
          <SidebarLabel>Expand/Collapse</SidebarLabel>
        </SidebarItem>
      </SidebarSection>
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
      </SidebarSection>
      <SidebarSpacer />
      <SidebarDivider />
      <SidebarSection>
        <SidebarItem href="/support">
          <LifebuoyIcon />
          <SidebarLabel>Support</SidebarLabel>
        </SidebarItem>
      </SidebarSection>
    </SidebarBody>
  </Sidebar>
)

const Component = ({ children }: any) => {
  const [expand, setExpand] = useState<boolean>(false)
  const [currentSidebar, setCurrentSidebar] = useState<string>('chat')

  return (
    <SidebarLayout
      isExpanded={expand}
      sidebar={
        <SidebarMenu current={currentSidebar} setCurrent={setCurrentSidebar} setExpand={() => setExpand(!expand)} />
      }
    >
      {children}
    </SidebarLayout>
  )
}

/**
 * Sidebar Layout primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  component: Component,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
