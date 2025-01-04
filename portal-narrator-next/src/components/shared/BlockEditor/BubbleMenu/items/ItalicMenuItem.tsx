import { Editor } from '@tiptap/react'
import { RiItalic } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function ItalicMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiItalic}
      isActive={editor.isActive('italic')}
      onClick={() => editor.chain().focus().toggleItalic().run()}
      tooltip="Italicize"
    />
  )
}
