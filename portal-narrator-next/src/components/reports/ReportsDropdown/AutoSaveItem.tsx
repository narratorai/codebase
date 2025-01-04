'use client'

import { DropdownItem } from '@/components/primitives/Dropdown'
import { Switch } from '@/components/primitives/Switch'
import { useReportUI } from '@/stores/reports'

export default function AutosaveItem() {
  const { autoSave, toggleAutoSave } = useReportUI()

  return (
    <DropdownItem>
      <div />
      <label className="flex-1 cursor-pointer" htmlFor="auto-save-toggle">
        Auto-save
      </label>
      <Switch checked={autoSave} id="auto-save-toggle" onChange={toggleAutoSave} />
    </DropdownItem>
  )
}
