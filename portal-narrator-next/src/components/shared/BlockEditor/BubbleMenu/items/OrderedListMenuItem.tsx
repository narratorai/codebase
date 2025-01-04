import { Editor } from '@tiptap/react'
import { RiListOrdered2 } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function OrderedListMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiListOrdered2}
      isActive={editor.isActive('orderedList')}
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      tooltip="Numbered list"
    />
  )
}
