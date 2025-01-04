import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import colors from 'tailwindcss/colors'

import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import DecisionNodeView from './DecisionNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    decision: {
      setDecision: () => ReturnType
    }
  }
}

interface DecisionOptions {
  /** The context used to compile the node. */
  compileContext: IReportNodeCompileContext
  HTMLAttributes: Record<string, any>
}

const Decision = Node.create<DecisionOptions>({
  name: 'decision',
  group: 'block',
  draggable: true,
  isolating: true,
  atom: true,

  addAttributes() {
    return {
      title: {
        default: null,
      },
      prompt: {
        default: null,
      },
      output: {
        default: { type: 'text', format: null, colorScheme: colors.yellow['100'] },
        renderHTML: (attrs) => ({ 'data-output': JSON.stringify(attrs.output) }),
        parseHTML: (element) => JSON.parse(element.getAttribute('data-output') ?? '{}'),
      },
      datasets: {
        default: [],
        renderHTML: (attrs) => ({ 'data-datasets': JSON.stringify(attrs.datasets) }),
        parseHTML: (element) => JSON.parse(element.getAttribute('data-datasets') ?? '[]'),
      },
      applyOn: {
        default: [],
        renderHTML: (attrs) => ({ 'data-apply-on': JSON.stringify(attrs.applyOn) }),
        parseHTML: (element) => JSON.parse(element.getAttribute('data-apply-on') ?? '[]'),
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
    const { title, prompt, output, datasets, applyOn } = node.attrs

    return `{% ${this.name} %}
      { title: ${title} }
      { prompt: ${prompt} }
      { output: ${JSON.stringify(output)} }
      { datasets: ${JSON.stringify(datasets)} }
      { applyOn: ${JSON.stringify(applyOn)} }
    {% end${this.name} %}`.replace(/\n/g, '')
  },

  addNodeView() {
    return ReactNodeViewRenderer(DecisionNodeView, {
      attrs: mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }),
    })
  },

  addCommands() {
    return {
      setDecision:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).run(),
    }
  },
})

export default Decision
