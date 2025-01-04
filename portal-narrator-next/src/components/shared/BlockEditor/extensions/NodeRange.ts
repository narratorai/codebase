import { Extension } from '@tiptap/core'
import { Node, NodeRange as NodeRangeModel, ResolvedPos } from '@tiptap/pm/model'
import { Plugin, PluginKey, Selection, SelectionRange } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

function getNodeRangeDecorations(selectionRanges: readonly SelectionRange[]) {
  if (!selectionRanges.length) return DecorationSet.empty

  const decorations: Decoration[] = []
  const parentNode = selectionRanges[0].$from.node(0)

  selectionRanges.forEach((selectionRange) => {
    const fromPos = selectionRange.$from.pos
    const nodeAfter = selectionRange.$from.nodeAfter

    if (nodeAfter) {
      const decoration = Decoration.node(fromPos, fromPos + nodeAfter.nodeSize, {
        class: 'ProseMirror-selectednoderange',
      })

      decorations.push(decoration)
    }
  })

  return DecorationSet.create(parentNode, decorations)
}

function getSelectionRanges(start: ResolvedPos, end: ResolvedPos, depth?: number) {
  const selectionRanges: SelectionRange[] = []
  const firstNode = start.node(0)

  depth =
    depth && depth >= 0
      ? depth
      : start.sameParent(end)
        ? Math.max(0, start.sharedDepth(end.pos) - 1)
        : start.sharedDepth(end.pos)

  const nodeRange = new NodeRangeModel(start, end, depth)
  const h = nodeRange.depth === 0 ? 0 : firstNode.resolve(nodeRange.start).posAtIndex(0)

  nodeRange.parent.forEach((node, index) => {
    const s = h + index
    const a = s + node.nodeSize

    if (s < nodeRange.start || s >= nodeRange.end) return

    const selectionRange = new SelectionRange(firstNode.resolve(s), firstNode.resolve(a))
    selectionRanges.push(selectionRange)
  })

  return selectionRanges
}

class Bookmark {
  anchor: number
  head: number

  constructor(anchor: number, head: number) {
    this.anchor = anchor
    this.head = head
  }

  map(t: any) {
    return new Bookmark(t.map(this.anchor), t.map(this.head))
  }

  resolve(doc: Node) {
    const anchor = doc.resolve(this.anchor)
    const head = doc.resolve(this.head)

    return new NodeRangeSelection(anchor, head)
  }
}

class NodeRangeSelection extends Selection {
  depth?: number

  constructor(anchor: ResolvedPos, head: ResolvedPos, depth?: number, direction = 1) {
    const { doc } = anchor
    const isSelectionAtHead = anchor === head
    const isSelectionAtEnd = anchor.pos === doc.content.size && head.pos === doc.content.size
    const adjustedHead =
      isSelectionAtHead && !isSelectionAtEnd ? doc.resolve(head.pos + (direction > 0 ? 1 : -1)) : head
    const adjustedAnchor =
      isSelectionAtHead && isSelectionAtEnd ? doc.resolve(anchor.pos - (direction > 0 ? 1 : -1)) : anchor
    const ranges = getSelectionRanges(adjustedAnchor.min(adjustedHead), adjustedAnchor.max(adjustedHead), depth)

    super(
      adjustedHead.pos >= anchor.pos ? ranges[0].$from : ranges[ranges.length - 1].$to,
      adjustedHead.pos >= anchor.pos ? ranges[ranges.length - 1].$to : ranges[0].$from,
      ranges
    )

    this.depth = depth
  }

  get $to() {
    return this.ranges[this.ranges.length - 1].$to
  }

  eq(nodeRangeSelection: Selection) {
    return (
      nodeRangeSelection instanceof NodeRangeSelection &&
      nodeRangeSelection.$from.pos === this.$from.pos &&
      nodeRangeSelection.$to.pos === this.$to.pos
    )
  }

  map(doc: Node, e: any) {
    const anchor = doc.resolve(e.map(this.anchor))
    const head = doc.resolve(e.map(this.head))

    return new NodeRangeSelection(anchor, head)
  }

  toJSON() {
    return { type: 'nodeRange', anchor: this.anchor, head: this.head }
  }

  get isForwards() {
    return this.head >= this.anchor
  }

  get isBackwards() {
    return !this.isForwards
  }

  extendBackwards() {
    const { doc } = this.$from

    if (this.isForwards && this.ranges.length > 1) {
      const rangesHead = this.ranges.slice(0, -1)
      const anchor = rangesHead[0].$from
      const head = rangesHead[rangesHead.length - 1].$to

      return new NodeRangeSelection(anchor, head, this.depth)
    }

    const firstNodeRange = this.ranges[0]
    const head = doc.resolve(Math.max(0, firstNodeRange.$from.pos - 1))

    return new NodeRangeSelection(this.$anchor, head, this.depth)
  }

  extendForwards() {
    const { doc } = this.$from

    if (this.isBackwards && this.ranges.length > 1) {
      const rangesTail = this.ranges.slice(1)
      const head = rangesTail[0].$from
      const anchor = rangesTail[rangesTail.length - 1].$to

      return new NodeRangeSelection(anchor, head, this.depth)
    }

    const lastRange = this.ranges[this.ranges.length - 1]
    const head = doc.resolve(Math.min(doc.content.size, lastRange.$to.pos + 1))

    return new NodeRangeSelection(this.$anchor, head, this.depth)
  }

  static fromJSON(doc: Node, json: Record<string, number>) {
    const { anchor, head } = json
    return new NodeRangeSelection(doc.resolve(anchor), doc.resolve(head))
  }

  static create(doc: Node, anchor: number, head: number, depth?: number, direction = 1) {
    return new this(doc.resolve(anchor), doc.resolve(head), depth, direction)
  }

  getBookmark() {
    return new Bookmark(this.anchor, this.head)
  }
}
NodeRangeSelection.prototype.visible = true

function isNodeRangeSelection(selection: Selection) {
  return selection instanceof NodeRangeSelection
}

interface Config {
  depth?: number
  key?: string
}

/**
 * NodeRange extension.
 *
 * It's based off of the `NodeRange` extension from @tiptap-pro.
 */
const NodeRange = new Extension<Config, any>({
  name: 'nodeRange',

  addOptions: () => ({
    depth: undefined,
    key: 'Mod',
  }),

  addKeyboardShortcuts() {
    return {
      'Shift-ArrowUp': ({ editor }) => {
        const { depth } = this.options
        const { view, state } = editor
        const { doc, selection, tr } = state
        const { anchor, head } = selection

        if (!isNodeRangeSelection(selection)) {
          const nodeRangeSelection = NodeRangeSelection.create(doc, anchor, head, depth, -1)
          tr.setSelection(nodeRangeSelection)
          view.dispatch(tr)

          return true
        }

        const extendedSelection = selection.extendBackwards()
        tr.setSelection(extendedSelection)
        view.dispatch(tr)

        return true
      },

      'Shift-ArrowDown': ({ editor }) => {
        const { depth } = this.options
        const { view, state } = editor
        const { doc, selection, tr } = state
        const { anchor, head } = selection

        if (!isNodeRangeSelection(selection)) {
          const nodeRangeSelection = NodeRangeSelection.create(doc, anchor, head, depth)
          tr.setSelection(nodeRangeSelection)
          view.dispatch(tr)

          return true
        }

        const extendedSelection = selection.extendForwards()
        tr.setSelection(extendedSelection)
        view.dispatch(tr)

        return true
      },

      'Mod-a': ({ editor }) => {
        const { depth } = this.options
        const { view, state } = editor
        const { doc, tr } = state
        const nodeRangeSelection = NodeRangeSelection.create(doc, 0, doc.content.size, depth)
        tr.setSelection(nodeRangeSelection)
        view.dispatch(tr)

        return true
      },
    }
  },

  onSelectionUpdate() {
    const { selection } = this.editor.state

    if (isNodeRangeSelection(selection)) {
      this.editor.view.dom.classList.add('ProseMirror-noderangeselection')
    }
  },

  addProseMirrorPlugins() {
    let isRange = false
    let isKeyCombinationPressed = false

    return [
      new Plugin({
        key: new PluginKey('nodeRange'),
        props: {
          attributes: () => (isRange ? { class: 'ProseMirror-noderangeselection' } : { class: '' }),
          handleDOMEvents: {
            mousedown: (view, event) => {
              const { key } = this.options
              const isMac = /Mac/.test(navigator.platform)
              const isShiftKeyPressed = !!event.shiftKey
              const isControlKeyPressed = !!event.ctrlKey
              const isAltKeyPressed = !!event.altKey
              const isMetaKeyPressed = !!event.metaKey

              if (
                key == null ||
                (key === 'Shift' && isShiftKeyPressed) ||
                (key === 'Control' && isControlKeyPressed) ||
                (key === 'Alt' && isAltKeyPressed) ||
                (key === 'Meta' && isMetaKeyPressed) ||
                (key === 'Mod' && (isMac ? isMetaKeyPressed : isControlKeyPressed))
              )
                isKeyCombinationPressed = true

              return (
                !!isKeyCombinationPressed &&
                (document.addEventListener(
                  'mouseup',
                  () => {
                    isKeyCombinationPressed = false
                    const { state } = view
                    const { doc, selection, tr } = state
                    const { $anchor: anchor, $head: head } = selection

                    if (anchor.sameParent(head)) return
                    const nodeRangeSelection = NodeRangeSelection.create(doc, anchor.pos, head.pos, this.options.depth)
                    tr.setSelection(nodeRangeSelection)
                    view.dispatch(tr)
                  },
                  { once: true }
                ),
                false)
              )
            },
          },

          decorations: (editorState) => {
            const { selection } = editorState
            const isNodeRange = isNodeRangeSelection(selection)
            isRange = false

            if (!isKeyCombinationPressed) {
              if (isNodeRange) {
                isRange = true
                return getNodeRangeDecorations(selection.ranges)
              }
              return null
            }

            const { $from: selectionStart, $to: selectionEnd } = selection
            if (!isNodeRange && selectionStart.sameParent(selectionEnd)) return null

            const selectionRanges = getSelectionRanges(selectionStart, selectionEnd, this.options.depth)
            if (selectionRanges.length) {
              isRange = true
              return getNodeRangeDecorations(selectionRanges)
            }
            return null
          },
        },
      }),
    ]
  },
})

export {
  NodeRange as default,
  getNodeRangeDecorations,
  getSelectionRanges,
  isNodeRangeSelection,
  NodeRange,
  NodeRangeSelection,
}
