import { mergeAttributes, Node } from '@tiptap/core'

const GridColumn = Node.create({
  name: 'gridColumn',
  group: 'gridColumn', // To not allow grid columns to be orphaned
  content: 'block*',
  draggable: false,
  defining: true,

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
})

export default GridColumn
