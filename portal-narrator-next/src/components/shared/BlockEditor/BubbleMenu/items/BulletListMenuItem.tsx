import { Editor } from '@tiptap/react'
import { RiListUnordered } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
}

export default function BulletListMenuItem({ editor }: Props) {
  return (
    <BubbleMenuItem
      Icon={RiListUnordered}
      isActive={editor.isActive('bulletList')}
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      tooltip="Bulleted list"
    />
  )
}
