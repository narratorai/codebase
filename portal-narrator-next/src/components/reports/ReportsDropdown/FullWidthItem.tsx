'use client'

import { DropdownItem } from '@/components/primitives/Dropdown'
import { Switch } from '@/components/primitives/Switch'
import { useReportUI } from '@/stores/reports'

export default function FullWidthItem() {
  const { fullWidth, toggleFullWidth } = useReportUI()

  return (
    <DropdownItem>
      <div />
      <label className="flex-1 cursor-pointer" htmlFor="full-width-toggle">
        Full width
      </label>
      <Switch checked={fullWidth} id="full-width-toggle" onChange={toggleFullWidth} />
    </DropdownItem>
  )
}
