import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'

import FileHandlerPlugin, { FileHandlerOptions } from './FileHandlerPlugin'
import { uploadAndInsert } from './util'

const FileHandler = Extension.create<FileHandlerOptions>({
  name: 'fileHandler',

  addOptions: () => ({
    onDrop: uploadAndInsert,
    onPaste: uploadAndInsert,
    allowedMimeTypes: [
      'image/png',
      'image/jpg',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/mpeg',
      'video/webm',
      'audio/aac',
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'application/msword',
      'application/pdf',
      'application/rtf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  }),

  addProseMirrorPlugins() {
    return [
      FileHandlerPlugin({
        key: new PluginKey(this.name),
        editor: this.editor,
        allowedMimeTypes: this.options.allowedMimeTypes,
        onDrop: this.options.onDrop,
        onPaste: this.options.onPaste,
      }),
    ]
  },
})

export { FileHandler as default }
