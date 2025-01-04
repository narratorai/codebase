import { combineTransactionSteps, Extension, findChildren, findChildrenInRange, getChangedRanges } from '@tiptap/core'
import { Fragment, Node, Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uniq } from 'lodash'
import { v4 } from 'uuid'

/**
 * Recursively traverse a document fragment to reset the specified attributes of its nodes.
 *
 * @param fragment A Fragment from ProseMirror's model, representing a part of the document
 * @param attributeName The name of the attribute to reset
 * @param types An array of node type names for which the IDs should be reset.
 */
function resetAttribute(fragment: Fragment, attributeName: string, types: string[]) {
  const nodes: Node[] = []

  fragment.forEach((node) => {
    if (node.isText) {
      return void nodes.push(node)
    } else if (!types.includes(node.type.name)) {
      const prunedNode = resetAttribute(node.content, attributeName, types)
      return void nodes.push(node.copy(prunedNode))
    }

    const nodeWithoutId = node.type.create(
      { ...node.attrs, [attributeName]: null },
      resetAttribute(node.content, attributeName, types),
      node.marks
    )
    nodes.push(nodeWithoutId)
  })

  return Fragment.from(nodes)
}

interface UniqueIDConfig {
  /** Name of the attribute that is attached to the HTML tag */
  attributeName: string

  /** Mutations to ignore, for example applied from other users through the collaboration plugin. */
  filterTransaction: null | ((transaction: any) => boolean)

  /** A function that generates a unique ID */
  generateID: () => string

  /** All types that should get a unique ID */
  types: string[]
}

/**
 * Extension that adds unique IDs to all nodes.
 * It's based off of the `UniqueID` extension from @tiptap-pro.
 */
const UniqueId = new Extension<UniqueIDConfig, any>({
  name: 'uniqueID',
  priority: 1e4,

  addOptions: () => ({
    attributeName: 'id',
    types: [
      'heading',
      'paragraph',
      'blockquote',
      'codeBlock',
      'listItem',
      'orderedList',
      'bulletList',
      'taskList',
      'table',
      'image',
      'file',
      'callout',
      'grid',
      'gridColumn',
      'dataTable',
      'plot',
      'filter',
      'datasetMetric',
      'decision',
    ],
    generateID: () => v4(),
    filterTransaction: null,
  }),

  addGlobalAttributes() {
    const { attributeName, types } = this.options

    return [
      {
        types,
        attributes: {
          [attributeName]: {
            default: null,
            parseHTML: (element) => element.getAttribute(`data-${attributeName}`),
            renderHTML: (attributes) =>
              attributes[attributeName]
                ? {
                    [attributeName]: attributes[attributeName],
                  }
                : {},
          },
        },
      },
    ]
  },

  onCreate() {
    const { view, state } = this.editor
    const { tr, doc } = state
    const { types, attributeName, generateID } = this.options

    const childrenWithoutId = findChildren(
      doc,
      (node) => types.includes(node.type.name) && node.attrs[attributeName] === null
    )

    childrenWithoutId.forEach(({ node, pos }) =>
      tr.setNodeMarkup(pos, null, {
        ...node.attrs,
        [attributeName]: generateID(),
      })
    )

    tr.setMeta('addToHistory', false)
    view.dispatch(tr)
  },

  /* eslint-disable-next-line max-lines-per-function */
  addProseMirrorPlugins() {
    let dropTarget: HTMLElement | null = null
    let pasteHandlingPending = false

    return [
      new Plugin({
        key: new PluginKey('uniqueID'),
        appendTransaction: (transactions, oldState, newState) => {
          const { types, attributeName, generateID, filterTransaction } = this.options

          const hasDocChanged =
            transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc)
          const shouldSkipTransaction =
            filterTransaction && transactions.some((transaction) => filterTransaction.call(this.options, transaction))

          const syncedTransaction = transactions.find((transaction) => transaction.getMeta('y-sync$'))
          if (syncedTransaction) return
          if (!hasDocChanged || shouldSkipTransaction) return

          // @ts-expect-error transactions is typed as readonly
          const transform = combineTransactionSteps(oldState.doc, transactions)
          const { mapping } = transform
          const { tr } = newState

          getChangedRanges(transform).forEach(({ newRange }) => {
            const changedNodes = findChildrenInRange(newState.doc, newRange, (node) => types.includes(node.type.name))
            const nodeIds = changedNodes.map(({ node }) => node.attrs[attributeName]).filter((attr) => attr !== null)

            changedNodes.forEach(({ node, pos }, index) => {
              const currentNode = tr.doc.nodeAt(pos)
              const currentNodeId = currentNode?.attrs[attributeName]

              if (currentNodeId === null) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  [attributeName]: generateID(),
                })

                return
              }

              const nextNode = changedNodes[index + 1]
              if (nextNode && node.content.size === 0) {
                tr.setNodeMarkup(nextNode.pos, undefined, {
                  ...nextNode.node.attrs,
                  [attributeName]: currentNodeId,
                })

                nodeIds[index + 1] = currentNodeId

                if (nextNode.node.attrs[attributeName]) return

                const newID = generateID()
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  [attributeName]: newID,
                })
                nodeIds[index] = newID
                return tr
              }

              const dupsPredicate = (item: string, index: number) => nodeIds.indexOf(item) !== index
              const allDuplicatedIds = nodeIds.filter(dupsPredicate)
              const duplicatedIds = uniq(allDuplicatedIds)
              const { deleted } = mapping.invert().mapResult(pos)

              if (deleted && duplicatedIds.includes(currentNodeId))
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  [attributeName]: generateID(),
                })
            })
          })

          // Return the modified transaction if there are any changes
          return tr.steps.length ? tr : undefined
        },

        props: {
          handleDOMEvents: {
            drop: (editorView, event) => {
              const allowedOp = event.dataTransfer ? event.dataTransfer.effectAllowed : undefined
              if (editorView.dom.parentElement === dropTarget && allowedOp !== 'copy') {
                dropTarget = null
                pasteHandlingPending = true
              }

              return false
            },
            paste: () => {
              pasteHandlingPending = true
              return false
            },
          },
          transformPasted: (slice) => {
            if (!pasteHandlingPending) return slice

            const { types, attributeName } = this.options
            const content = resetAttribute(slice.content, attributeName, types)
            const prunedSlice = new Slice(content, slice.openStart, slice.openEnd)

            pasteHandlingPending = false
            return prunedSlice
          },
        },
      }),
    ]
  },
})

export default UniqueId
