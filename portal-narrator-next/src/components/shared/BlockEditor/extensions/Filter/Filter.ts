import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import FilterNodeView from './FilterNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    filter: {
      setFilter: () => ReturnType
    }
  }
}

interface FilterOptions {
  /** The context used to compile the node. */
  compileContext: IReportNodeCompileContext
  HTMLAttributes: Record<string, any>
}

const Filter = Node.create<FilterOptions>({
  name: 'filter',
  group: 'block',
  draggable: true,
  isolating: true,
  atom: true,

  addAttributes() {
    return {
      name: {
        default: 'Unknown',
      },
      type: {
        default: 'string',
      },
      operator: {
        default: 'equals',
      },
      defaultValue: {
        default: 'Month',
      },
      applyOn: {
        default: [],
        renderHTML: (attrs) => ({ 'data-apply-on': JSON.stringify(attrs.applyOn) }),
        parseHTML: (element) => JSON.parse(element.getAttribute('data-apply-on') ?? '{}'),
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
    const { name, type, operator, defaultValue, applyOn } = node.attrs

    return `{% ${this.name} %}
      { name: ${name} }
      { type: ${type} }
      { operator: ${operator} }
      { defaultValue: ${defaultValue} }
      { applyOn: ${JSON.stringify(applyOn)} }
    {% end${this.name} %}`.replace(/\n/g, '')
  },

  addNodeView() {
    return ReactNodeViewRenderer(FilterNodeView, {
      attrs: mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name, class: 'mx-auto max-w-lg' }),
    })
  },

  addCommands() {
    return {
      setFilter:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).run(),
    }
  },
})

export default Filter
