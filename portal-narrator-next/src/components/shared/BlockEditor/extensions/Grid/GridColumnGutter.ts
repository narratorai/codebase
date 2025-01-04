import { mergeAttributes, Node } from '@tiptap/core'

const GridColumnGutter = Node.create({
  name: 'gridColumnGutter',
  group: 'gridColumnGutter', // Very specific group name so it's not added by mistake to other nodes as content
  isolating: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name })]
  },
})

export default GridColumnGutter
