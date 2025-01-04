import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import FileNodeView from './RemoteFileNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    remoteFile: {
      /**
       * Add a remote file
       * @param options The file attributes
       * @example
       * editor
       *   .commands
       *   .setRemoteFile({ dataSrc: '948f141f-c10f-4c92.pdf', title: 'Logo' })
       */
      setRemoteFile: (options: { title?: string; dataSrc: string; mimeType: string }) => ReturnType

      /**
       * Add a remote file placeholder
       */
      setFilePlaceholder: () => ReturnType
    }
  }
}

interface RemoteFileOptions {
  baseUrl: string
  HTMLAttributes: Record<string, any>
}

const RemoteFile = Node.create<RemoteFileOptions>({
  name: 'file',
  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      title: {
        default: null,
      },
      dataSrc: {
        default: null,
      },
      mimeType: {
        default: null,
      },
      height: {
        default: 400,
      },
      width: {
        default: '100%',
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileNodeView, {
      attrs: mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }),
    })
  },

  addCommands() {
    return {
      setRemoteFile:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: options })
        },

      setFilePlaceholder:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: { dataSrc: null, mimeType: null, title: null } })
        },
    }
  },
})

export default RemoteFile
