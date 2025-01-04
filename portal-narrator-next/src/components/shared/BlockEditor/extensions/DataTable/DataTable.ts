import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import DataTableNodeView from './DataTableNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dataTable: {
      setDataTable: () => ReturnType
    }
  }
}

interface DataTableOptions {
  /** The context used to compile the node. */
  compileContext: IReportNodeCompileContext
  HTMLAttributes: Record<string, any>
}

const DataTable = Node.create<DataTableOptions>({
  name: 'dataTable',
  group: 'block',
  draggable: true,
  isolating: true,
  atom: true,

  addAttributes() {
    return {
      dataset: {
        default: {
          id: '',
          tab: {
            slug: '',
          },
        },
        renderHTML: (attrs) => ({ 'data-dataset': JSON.stringify(attrs.dataset) }),
        parseHTML: (element) => JSON.parse(element.getAttribute('data-dataset') ?? '{}'),
      },
      height: {
        default: 400,
      },
      width: {
        default: '100%',
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
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name })]
  },

  renderText({ node }) {
    const { dataset } = node.attrs

    return `{% ${this.name} %}
      { dataset.id: ${dataset.id} }
      { dataset.tab.slug: ${dataset.tab.slug} }
    {% end${this.name} %}`.replace(/\n/g, '')
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataTableNodeView, {
      attrs: mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }),
    })
  },

  addCommands() {
    return {
      setDataTable:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).createParagraphNear().run(),
    }
  },
})

export default DataTable
