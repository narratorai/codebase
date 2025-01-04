import { Editor } from '@tiptap/react'
import { RiSuperscript } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function SuperscriptMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiSuperscript}
      isActive={editor.isActive('superscript')}
      onClick={() => editor.chain().focus().toggleSuperscript().run()}
      tooltip="Superscript"
    />
  )
}
