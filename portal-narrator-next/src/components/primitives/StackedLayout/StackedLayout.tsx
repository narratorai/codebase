'use client'

import { useState } from 'react'

import { NavbarItem } from '../Navbar'
import MobileSidebar from './MobileSidebar'
import OpenMenuIcon from './OpenMenuIcon'

type Props = React.PropsWithChildren<{ navbar: React.ReactNode; sidebar: React.ReactNode }>

const StackedLayout = ({ children, navbar, sidebar }: Props) => {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="relative isolate flex min-h-svh w-full flex-col bg-white lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
      {/* Sidebar on mobile */}
      <MobileSidebar close={() => setShowSidebar(false)} open={showSidebar}>
        {sidebar}
      </MobileSidebar>

      {/* Navbar */}
      <header className="flex items-center px-4">
        <div className="py-2.5 lg:hidden">
          <NavbarItem aria-label="Open navigation" onClick={() => setShowSidebar(true)}>
            <OpenMenuIcon />
          </NavbarItem>
        </div>
        <div className="min-w-0 flex-1">{navbar}</div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col pb-2 lg:px-2">
        <div className="grow p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default StackedLayout
