'use client'

import * as Popover from '@radix-ui/react-popover'
import { Editor } from '@tiptap/react'
import clsx from 'clsx'
import { RiMarkPenLine } from 'react-icons/ri'

import { textHighlightPalette } from './colors'
import HighlightButton from './HighlightButton'

interface Props {
  editor: Editor
}

/**
 * Bubble menu item for the text highlight feature.
 */
export default function HighlightMenuItem({ editor }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={clsx('rounded p-1.5 text-gray-100 hover:bg-gray-600')}>
          <RiMarkPenLine className="size-4" />
        </button>
      </Popover.Trigger>

      <Popover.Content className="z-50" side="bottom" sideOffset={6}>
        <div className="rounded-md bg-white p-2 shadow-md">
          <div className="grid grid-cols-4 gap-2">
            {textHighlightPalette.map((color) => (
              <HighlightButton color={color} editor={editor} key={color} />
            ))}
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
