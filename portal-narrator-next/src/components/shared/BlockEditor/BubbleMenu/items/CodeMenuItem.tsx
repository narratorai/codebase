import { Editor } from '@tiptap/react'
import { RiCodeSSlashLine } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function CodeMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiCodeSSlashLine}
      isActive={editor.isActive('code')}
      onClick={() => editor.chain().focus().toggleCode().run()}
      tooltip="Mark as code"
    />
  )
}
