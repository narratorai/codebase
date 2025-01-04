'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { LuSave } from 'react-icons/lu'

import { Button } from '@/components/primitives/Button'
import { useReportUI } from '@/stores/reports'

export default function SaveReportButton() {
  const isSaving = useReportUI((state) => state.isSaving)

  const handleClick = () => {
    // TODO: Hack. Store the editor in the report store and call saveContent on it.
    // The shift+meta+s shortcut is configured in the StoredEditor component.
    const event = new KeyboardEvent('keydown', {
      code: 'KeyS',
      key: 's',
      metaKey: true,
      shiftKey: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <Button disabled={isSaving} onClick={handleClick} plain title="Save report">
      {isSaving ? (
        <ArrowPathIcon className="animate-spin" />
      ) : (
        // https://github.com/tailwindlabs/heroicons/discussions/476
        <LuSave className="h-5" strokeWidth={1.5} />
      )}
    </Button>
  )
}
