import { BookmarkIcon as OutlineBookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as SolidBookmarkIcon, EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { AvatarButton } from '../Avatar'
import { Navbar, NavbarDivider, NavbarItem, NavbarSection, NavbarSpacer } from '.'

const Component = () => {
  const [current, setCurrent] = useState<string>('item1')
  const [bookmarked, setBookmared] = useState<boolean>(false)

  return (
    <div className="w-full min-w-[768px]">
      <Navbar>
        <AvatarButton color="transparent" href="/" size="sm" src="static/mavis/icons/logo.svg" />
        <NavbarDivider />
        <NavbarSection>
          <NavbarItem current={current === 'item1'} href="/navbar-item-1" onClick={() => setCurrent('item1')}>
            Navbar Item 1
          </NavbarItem>
          <NavbarItem current={current === 'item2'} href="/navbar-item-2" onClick={() => setCurrent('item2')}>
            Navbar Item 2
          </NavbarItem>
          <NavbarItem current={current === 'item3'} href="/navbar-item-3" onClick={() => setCurrent('item3')}>
            Navbar Item 3
          </NavbarItem>
        </NavbarSection>
        <NavbarSpacer />
        <NavbarSection>
          <NavbarItem aria-label="Bookmark" href="/bookmark" onClick={() => setBookmared(!bookmarked)}>
            {!bookmarked && <OutlineBookmarkIcon />}
            {bookmarked && <SolidBookmarkIcon />}
          </NavbarItem>
          <NavbarItem aria-label="Search" href="/search">
            <MagnifyingGlassIcon />
            Navbar Item 4
          </NavbarItem>
          <NavbarItem aria-label="Menu" href="/menu">
            <EllipsisVerticalIcon />
          </NavbarItem>
        </NavbarSection>
      </Navbar>
    </div>
  )
}

/**
 * Navbar primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  argTypes: {},
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
