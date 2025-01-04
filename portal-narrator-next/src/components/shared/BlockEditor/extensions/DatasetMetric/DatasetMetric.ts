import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import DatasetMetricNodeView from './DatasetMetricNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    datasetMetric: {
      setDatasetMetric: () => ReturnType
    }
  }
}

interface DatasetMetricOptions {
  /** The context used to compile the node. */
  compileContext: IReportNodeCompileContext
  HTMLAttributes: Record<string, any>
}

const DatasetMetric = Node.create<DatasetMetricOptions>({
  name: 'datasetMetric',
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
            column: {
              id: '',
            },
          },
        },
      },
      showPlot: {
        default: false,
      },
      plotColor: {
        default: '#48494B',
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
    const { dataset, showPlot, plotColor } = node.attrs

    return `{% ${this.name} %}
      { dataset.id: ${dataset.id} }
      { dataset.tab.slug: ${dataset.tab.slug} }
      { dataset.tab.column.id: ${dataset.tab.column.id} }
      { showPlot: ${showPlot} }
      { plotColor: ${plotColor} }
    {% end${this.name} %}`.replace(/\n/g, '')
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatasetMetricNodeView, {
      attrs: mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name, class: 'mx-auto max-w-lg' }),
    })
  },

  addCommands() {
    return {
      setDatasetMetric:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).createParagraphNear().run(),
    }
  },
})

export default DatasetMetric
