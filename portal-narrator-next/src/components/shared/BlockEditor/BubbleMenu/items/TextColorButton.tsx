import { Editor } from '@tiptap/react'

import ColorButton from './ColorButton'

interface Props {
  color: string
  editor: Editor
}

export default function TextColorButton({ color, editor }: Props) {
  const isActive = editor.isActive('textStyle', { color })

  const toggleColor = () => {
    if (isActive) {
      editor.chain().focus().unsetColor().run()
    } else {
      editor.chain().focus().setColor(color).run()
    }
  }

  return <ColorButton color={color} isSelected={isActive} onClick={toggleColor} />
}
