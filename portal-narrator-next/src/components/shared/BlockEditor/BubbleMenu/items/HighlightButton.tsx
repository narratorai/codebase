import { Editor } from '@tiptap/react'

import ColorButton from './ColorButton'

interface Props {
  color: string
  editor: Editor
}

export default function HighlightButton({ editor, color }: Props) {
  const isActive = editor.isActive('highlight', { color })

  const toggleHighlightColor = () => {
    editor.chain().focus().toggleHighlight({ color }).run()
  }

  return <ColorButton color={color} isSelected={isActive} onClick={toggleHighlightColor} />
}
