import { Editor } from '@tiptap/react'
import { RiBold } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function BoldMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiBold}
      isActive={editor.isActive('bold')}
      onClick={() => editor.chain().focus().toggleBold().run()}
      tooltip="Bold"
    />
  )
}
