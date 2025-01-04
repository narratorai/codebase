'use client'

import * as Popover from '@radix-ui/react-popover'
import { Editor } from '@tiptap/react'
import clsx from 'clsx'
import { RiFontColor } from 'react-icons/ri'

import { textColorPalette } from './colors'
import TextColorButton from './TextColorButton'

interface Props {
  editor: Editor
}

/**
 * Bubble menu item for the text color feature.
 */
export default function TextColorMenuItem({ editor }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={clsx('rounded p-1.5 text-gray-100 hover:bg-gray-600')}>
          <RiFontColor className="size-4" />
        </button>
      </Popover.Trigger>

      <Popover.Content side="bottom" sideOffset={6}>
        <div className="rounded-md bg-white p-2 shadow-md">
          <div className="grid grid-cols-6 gap-2">
            {textColorPalette.map((color) => (
              <TextColorButton color={color} editor={editor} key={color} />
            ))}
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
