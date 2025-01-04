import { usePathname } from 'next/navigation'

import { SidebarItem, SidebarLabel } from '@/components/primitives/Sidebar'
import { Tooltip } from '@/components/primitives/Tooltip'

interface Props {
  href?: string
  Icon: React.ComponentType<React.ComponentProps<any>>
  isExpanded?: boolean
  label: string
  onClick?: () => void
}

const MainMenuItem = ({ href = '#', Icon, isExpanded = false, label, onClick }: Props) => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith(href)

  return (
    <Tooltip content={{ side: 'right', sideOffset: 16 }} showArrow tip={isExpanded ? null : label}>
      <SidebarItem current={isActive} href={href} onClick={onClick}>
        <Icon />
        {isExpanded && <SidebarLabel>{label}</SidebarLabel>}
      </SidebarItem>
    </Tooltip>
  )
}

export default MainMenuItem
