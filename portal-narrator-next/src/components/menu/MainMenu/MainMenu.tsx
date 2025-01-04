'use client'

import { Sidebar, SidebarBody, SidebarFooter, SidebarHeader } from '@/components/primitives/Sidebar'

import MainMenuBody from './MainMenuBody'
import MainMenuFooter from './MainMenuFooter'
import MainMenuHeader from './MainMenuHeader'

interface Props {
  isExpanded?: boolean
  onExpandClick: () => void
}

const MainMenu = ({ isExpanded, onExpandClick }: Props) => (
  <Sidebar>
    <SidebarHeader>
      <MainMenuHeader isExpanded={isExpanded} toggleMenu={onExpandClick} />
    </SidebarHeader>
    <SidebarBody>
      <MainMenuBody isExpanded={isExpanded} />
    </SidebarBody>
    <SidebarFooter>
      <MainMenuFooter isExpanded={isExpanded} />
    </SidebarFooter>
  </Sidebar>
)

export default MainMenu
