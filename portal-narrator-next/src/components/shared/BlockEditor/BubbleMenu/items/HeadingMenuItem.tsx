import { Editor } from '@tiptap/react'
import { RiH1, RiH2, RiH3 } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  editor: Editor
  level: 1 | 2 | 3
}

export default function HeadingMenuItem({ editor, level }: Props) {
  return (
    <BubbleMenuItem
      Icon={level === 1 ? RiH1 : level === 2 ? RiH2 : RiH3}
      isActive={editor.isActive('heading', { level })}
      onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
      tooltip={level === 1 ? 'Big heading' : level === 2 ? 'Medium heading' : 'Small heading'}
    />
  )
}
