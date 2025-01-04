import { Editor } from '@tiptap/react'
import { RiText } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function ParagraphMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiText}
      isActive={editor.isActive('paragraph')}
      onClick={() => editor.chain().focus().setParagraph().run()}
      tooltip="Text"
    />
  )
}
