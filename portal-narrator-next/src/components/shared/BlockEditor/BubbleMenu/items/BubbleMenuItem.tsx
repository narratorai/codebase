'use client'

import clsx from 'clsx'

import Tooltip, { TooltipContent, TooltipTrigger } from '@/components/shared/Tooltip'

interface Props {
  Icon: JSX.ElementType
  isActive?: boolean
  onClick?: () => void
  shortcut?: string
  tooltip?: string
}

export default function BubbleMenuItem({ Icon, onClick, isActive, tooltip }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          className={clsx('rounded p-1.5 text-gray-100 hover:bg-gray-600', { 'bg-gray-600': isActive })}
          onClick={onClick}
        >
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="rounded bg-gray-1000 px-2 py-1 text-xs text-white" side="top" sideOffset={5}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
