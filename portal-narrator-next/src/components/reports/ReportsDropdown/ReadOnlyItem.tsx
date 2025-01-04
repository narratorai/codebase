'use client'

import { DropdownItem } from '@/components/primitives/Dropdown'
import { Switch } from '@/components/primitives/Switch'
import { useReportUI } from '@/stores/reports'

export default function ReadOnlyItem() {
  const { readOnly, toggleReadOnly } = useReportUI()

  return (
    <DropdownItem>
      <div />
      <label className="flex-1 cursor-pointer" htmlFor="read-only-toggle">
        Preview mode
      </label>
      <Switch checked={readOnly} id="read-only-toggle" onChange={toggleReadOnly} />
    </DropdownItem>
  )
}
