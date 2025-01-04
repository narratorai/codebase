import { Editor } from '@tiptap/react'
import { RiAlignCenter, RiAlignLeft, RiAlignRight } from 'react-icons/ri'

import BubbleMenuItem from './BubbleMenuItem'

interface Props {
  alignment: 'center' | 'left' | 'right'
  editor: Editor
}

export default function TextAlignMenuItem({ editor, alignment }: Props) {
  const toggleTextAlign = (alignment: string) => {
    if (editor.isActive({ textAlign: alignment })) {
      editor.chain().focus().unsetTextAlign().run()
    } else {
      editor.chain().focus().setTextAlign(alignment).run()
    }
  }

  return (
    <BubbleMenuItem
      Icon={alignment === 'center' ? RiAlignCenter : alignment === 'left' ? RiAlignLeft : RiAlignRight}
      isActive={editor.isActive({ textAlign: alignment })}
      onClick={() => toggleTextAlign(alignment)}
      tooltip={`Align ${alignment}`}
    />
  )
}
