import { mergeAttributes, Node } from '@tiptap/core'
import SplitGrid from 'split-grid'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    horizontalGrid: {
      setHorizontalGrid: (numberOfColumns: number) => ReturnType
    }
  }
}

const HorizontalGrid = Node.create({
  name: 'horizontalGrid',
  group: 'block',
  content: 'gridColumn gridColumnGutter gridColumn (gridColumnGutter gridColumn)*',
  isolating: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      gridTemplateColumns: {
        default: null,
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
    const { gridTemplateColumns } = HTMLAttributes
    const style = `display: grid; grid-template-columns: ${gridTemplateColumns};`

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        id: HTMLAttributes.uid,
        style,
        'data-type': this.name,
      }),
      0,
    ]
  },

  addNodeView() {
    return ({ node, view }) => {
      const dom = document.createElement('div')
      dom.setAttribute('data-type', this.name)
      dom.style.display = 'grid'
      dom.style.gridTemplateColumns = node.attrs.gridTemplateColumns

      const instance = SplitGrid({
        minSize: 100,
        dragInterval: 5,
        columnGutters: [],
        onDrag: (direction, track, gridTemplateStyle) => {
          const pos = view.posAtDOM(dom, 0) - 1 // TODO: Get parent
          const node = view.state.doc.nodeAt(pos)

          let gridTemplateColumns = node?.attrs.gridTemplateColumns
          if (direction === 'column') gridTemplateColumns = gridTemplateStyle

          const transaction = view.state.tr.setNodeMarkup(pos, undefined, {
            ...node?.attrs,
            gridTemplateColumns,
          })
          view.dispatch(transaction)
        },
      })

      const callback = function (mutationsList: MutationRecord[]) {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            for (const addedNode of mutation.addedNodes) {
              if (addedNode instanceof HTMLElement && addedNode.dataset.type === 'gridColumnGutter') {
                const index = Array.from(dom.children).indexOf(addedNode)
                instance.addColumnGutter(addedNode, index)
              }
            }
          }
        }
      }

      const observer = new MutationObserver(callback)
      observer.observe(dom, { childList: true })

      return {
        dom,
        contentDOM: dom,
        ignoreMutation(mutation) {
          return mutation.type === 'attributes' && mutation.attributeName === 'style'
        },
        update() {
          return true
        },
        destroy() {
          observer.disconnect()
          instance.destroy(true)
        },
      }
    }
  },

  addCommands() {
    return {
      setHorizontalGrid:
        (numberOfColumns) =>
        ({ chain }) => {
          if (numberOfColumns < 2) throw new Error('A grid must have at least 2 columns.')

          const gridTemplateColumns = Array(numberOfColumns).fill('1fr').join(' 12px ')

          const childCount = numberOfColumns * 2 - 1
          const gridContent = Array.from({ length: childCount }, (_, index) =>
            index % 2 === 0
              ? { type: 'gridColumn', content: [{ type: 'paragraph' }] } // Default content for each column
              : { type: 'gridColumnGutter' }
          )

          return chain()
            .insertContent({ type: this.name, content: gridContent, attrs: { gridTemplateColumns } })
            .createParagraphNear()
            .run()
        },
    }
  },
})

export default HorizontalGrid
