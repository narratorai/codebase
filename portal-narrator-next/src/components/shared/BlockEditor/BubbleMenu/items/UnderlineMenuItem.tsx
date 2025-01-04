import { Editor } from '@tiptap/react'
import { RiUnderline } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function UnderlineMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiUnderline}
      isActive={editor.isActive('underline')}
      onClick={() => editor.chain().focus().toggleUnderline().run()}
      tooltip="Underline"
    />
  )
}
