import { Editor } from '@tiptap/core'
import EditIcon from 'static/mavis/icons/edit.svg'

import TextAlignMenuItem from '../../BubbleMenu/items/TextAlignMenuItem'

interface Props {
  editor: Editor
  onEditClick: () => void
}

export default function EditPlotMenu({ onEditClick, editor }: Props) {
  return (
    <div className="gap-0.5 rounded-md bg-gray-900 p-1 text-white shadow-sm flex-x-center">
      <button
        className="gap-0.5 rounded p-1.5 text-xs font-medium text-gray-100 flex-x-center hover:bg-gray-600"
        onClick={onEditClick}
      >
        <EditIcon className="size-4" />
        <span>Edit plot</span>
      </button>
      <TextAlignMenuItem alignment="left" editor={editor} />
      <TextAlignMenuItem alignment="center" editor={editor} />
      <TextAlignMenuItem alignment="right" editor={editor} />
    </div>
  )
}
