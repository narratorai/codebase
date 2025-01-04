import { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface FileHandlerOptions {
  allowedMimeTypes: string[]
  onDrop?: (editor: Editor, files: File[], position?: number) => void
  onPaste?: (editor: Editor, files: File[]) => void
}

type FileHandlerPluginOptions = {
  key: PluginKey
  editor: Editor
} & FileHandlerOptions

/**
 * ProseMirror plugin to handle file drops and pastes.
 */
const FileHandlerPlugin = ({ allowedMimeTypes, editor, key, onDrop, onPaste }: FileHandlerPluginOptions) => {
  return new Plugin({
    key,

    props: {
      handleDrop(view, event) {
        const { dataTransfer } = event

        if (!onDrop) return true
        // Do not interfere with the drag/drop plugin
        if (!dataTransfer || !dataTransfer.files.length) return false

        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        let files = Array.from(dataTransfer.files)

        if (allowedMimeTypes) {
          files = files.filter((file) => allowedMimeTypes.includes(file.type))
        }

        if (files.length !== 0) {
          event.preventDefault()
          event.stopPropagation()
          onDrop(editor, files, coords ? coords.pos : 0)
          return true
        }

        return false
      },

      handlePaste(_, event) {
        const { clipboardData } = event

        if (!onPaste) return true
        // Do not interfere with pasting text
        if (!clipboardData || !clipboardData.files.length) return false

        const data = clipboardData.getData('text/html')
        let files = Array.from(clipboardData.files)

        if (allowedMimeTypes) {
          files = files.filter((file) => allowedMimeTypes.includes(file.type))
        }

        if (files.length !== 0) {
          event.preventDefault()
          event.stopPropagation()
          onPaste(editor, files)

          return data.length === 0
        }

        return false
      },
    },
  })
}

export default FileHandlerPlugin
