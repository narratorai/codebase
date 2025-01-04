import { Editor } from '@tiptap/react'
import { RiStrikethrough } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function StrikethroughMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiStrikethrough}
      isActive={editor.isActive('strike')}
      onClick={() => editor.chain().focus().toggleStrike().run()}
      tooltip="Strike-through"
    />
  )
}
