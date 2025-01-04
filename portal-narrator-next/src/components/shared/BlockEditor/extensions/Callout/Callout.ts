import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import colors from 'tailwindcss/colors'

import CalloutNodeView from './CalloutNodeView'

// TODO: Import emoji from @emoji-mart/data
const checkmarkEmoji = '\u2714 \uFE0F'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType
    }
  }
}

interface CalloutOptions {
  HTMLAttributes: Record<string, any>
}

const Callout = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: '(paragraph|heading|horizontalRule|image|list)+',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: colors.gray['50'],
      },
      icon: {
        default: checkmarkEmoji,
      },
      hideIcon: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView, {
      attrs: mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }),
    })
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name)
        },
    }
  },
})

export default Callout
