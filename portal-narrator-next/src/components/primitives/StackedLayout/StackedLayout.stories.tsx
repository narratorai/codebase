import {
  ArrowPathRoundedSquareIcon,
  BoltIcon,
  BookmarkIcon as OutlineBookmarkIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  LifebuoyIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import { BookmarkIcon as SolidBookmarkIcon, EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '../Navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '../Sidebar'
import { StackedLayout } from '.'

const SidebarMenu = ({ current, setCurrent }: any) => (
  <Sidebar>
    <SidebarBody>
      <SidebarSection>
        <SidebarItem current={current === 'chat'} href="/chat" onClick={() => setCurrent('chat')}>
          <ChatBubbleLeftRightIcon className="!fill-none" />
          <SidebarLabel>Mavis AI</SidebarLabel>
        </SidebarItem>

        <SidebarItem current={current === 'datasets'} href="/datasets" onClick={() => setCurrent('datasets')}>
          <TableCellsIcon className="!fill-none" />
          <SidebarLabel>Visual query</SidebarLabel>
        </SidebarItem>

        <SidebarItem
          current={current === 'customer-journey'}
          href="/customer-journey"
          onClick={() => setCurrent('customer-journey')}
        >
          <ArrowPathRoundedSquareIcon className="!fill-none" />
          <SidebarLabel>Customer journey</SidebarLabel>
        </SidebarItem>

        <SidebarItem current={current === 'activities'} href="/activities" onClick={() => setCurrent('activities')}>
          <BoltIcon className="!fill-none" />
          <SidebarLabel>Activities</SidebarLabel>
        </SidebarItem>

        <SidebarItem current={current === 'dashboards'} href="/dashboards" onClick={() => setCurrent('dashboards')}>
          <ChartPieIcon className="!fill-none" />
          <SidebarLabel>Dashboards</SidebarLabel>
        </SidebarItem>
      </SidebarSection>
      <SidebarSpacer />
      <SidebarDivider />
      <SidebarSection>
        <SidebarItem href="/support">
          <LifebuoyIcon className="!fill-none" />
          <SidebarLabel>Support</SidebarLabel>
        </SidebarItem>
      </SidebarSection>
    </SidebarBody>
  </Sidebar>
)

const NavbarMenu = ({ bookmarked, current, setBookmared, setCurrent }: any) => (
  <Navbar>
    <NavbarSection>
      <NavbarItem current={current === 'item1'} href="/navbar-item-1" onClick={() => setCurrent('item1')}>
        Navbar Item 1
      </NavbarItem>
      <NavbarItem current={current === 'item2'} href="/navbar-item-2" onClick={() => setCurrent('item2')}>
        Navbar Item 1
      </NavbarItem>
      <NavbarItem current={current === 'item3'} href="/navbar-item-3" onClick={() => setCurrent('item3')}>
        Navbar Item 1
      </NavbarItem>
    </NavbarSection>
    <NavbarSpacer />
    <NavbarSection>
      <NavbarItem aria-label="Bookmark" href="/bookmark" onClick={() => setBookmared(!bookmarked)}>
        {!bookmarked && <OutlineBookmarkIcon className="!fill-none" />}
        {bookmarked && <SolidBookmarkIcon />}
      </NavbarItem>
      <NavbarItem aria-label="Search" href="/search">
        <MagnifyingGlassIcon />
      </NavbarItem>
      <NavbarItem aria-label="Menu" href="/menu">
        <EllipsisVerticalIcon />
      </NavbarItem>
    </NavbarSection>
  </Navbar>
)

const Component = ({ children }: any) => {
  const [currentSidebar, setCurrentSidebar] = useState<string>('chat')
  const [currentNavbar, setCurrentNavbar] = useState<string>('chat')
  const [bookmarked, setBookmared] = useState<boolean>(false)

  return (
    <StackedLayout
      navbar={
        <NavbarMenu
          bookmarked={bookmarked}
          current={currentNavbar}
          setBookmared={setBookmared}
          setCurrent={setCurrentNavbar}
        />
      }
      sidebar={<SidebarMenu current={currentSidebar} setCurrent={setCurrentSidebar} />}
    >
      {children}
    </StackedLayout>
  )
}

/**
 * Stacked Layout primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  argTypes: {
    children: { control: 'text' },
  },
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Stacked Layout Content',
  },
}
