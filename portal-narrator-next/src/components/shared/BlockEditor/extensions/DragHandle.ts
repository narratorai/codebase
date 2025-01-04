import { computePosition, offset, Placement } from '@floating-ui/dom'
import { Editor, Extension } from '@tiptap/core'
import { Plugin, PluginKey, SelectionRange } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { clamp } from 'lodash'
import { Node } from 'prosemirror-model'

import { getSelectionRanges, NodeRangeSelection } from './NodeRange'

type Doc = Editor['view']['state']['doc']

function positionTooltip(parentEl: Element, tooltipEl: HTMLElement, options?: { placement: Placement }) {
  const isHeading = parentEl.tagName.startsWith('H')
  const crossAxisOffset = isHeading ? parseInt(getStyleProperty(tooltipEl, 'height').replace('px', ''), 10) / 4 : 0

  return computePosition(parentEl, tooltipEl, {
    placement: options?.placement ?? 'left-start',
    middleware: [offset({ crossAxis: crossAxisOffset, mainAxis: 6 })],
  }).then(({ x, y }) => {
    const left = `${x}px`
    const top = `${y}px`
    Object.assign(tooltipEl.style, { left, top })
  })
}

function deepClone(node: HTMLElement) {
  const clonedNode = node.cloneNode(true) as HTMLElement
  const originalElements = [node, ...Array.from(node.getElementsByTagName('*'))] as HTMLElement[]
  const clonedElements = [clonedNode, ...Array.from(clonedNode.getElementsByTagName('*'))] as HTMLElement[]

  originalElements.forEach((originalElement, index) => {
    clonedElements[index].style.cssText = originalElement.style.cssText
  })

  return clonedNode
}

function findNodeAtPosition(
  position: {
    x: number
    y: number
    direction: string
  },
  editor: Editor
) {
  const { x, y, direction } = position
  let targetElement = null
  let targetNode = null
  let pos = null
  let cursorX = x

  while (!targetNode && cursorX > 0 && cursorX < window.innerWidth) {
    const elementsAtPoint = document.elementsFromPoint(cursorX, y)
    const editorIndex = elementsAtPoint.findIndex((el) => el.classList.contains('ProseMirror'))
    const nonEditorElements = elementsAtPoint.slice(0, editorIndex)

    if (nonEditorElements.length > 0) {
      const element = nonEditorElements[0]
      targetElement = element
      pos = editor.view.posAtDOM(element, 0)

      if (pos >= 0) {
        targetNode = editor.state.doc.nodeAt(Math.max(pos - 1, 0))

        // Ensure we are not selecting a text node by checking node type
        if (targetNode && targetNode.isText) {
          targetNode = editor.state.doc.nodeAt(Math.max(pos - 1, 0))
        }

        if (!targetNode) {
          targetNode = editor.state.doc.nodeAt(Math.max(pos, 0))
        }
        break
      }
    }

    cursorX += direction === 'left' ? -1 : 1
  }

  return { resultElement: targetElement, resultNode: targetNode, pos: null != pos ? pos : null }
}

function getStyleProperty(element: Element, styleKey: string) {
  // @ts-expect-error CSS2Properties exposes this API
  return window.getComputedStyle(element)[styleKey]
}

function removeElementFromParent(element: Element) {
  element.parentNode?.removeChild(element)
}

function calculateEditorPosition(editorView: EditorView, left: number, top: number) {
  const paddingLeft = parseInt(getStyleProperty(editorView.dom, 'paddingLeft'), 10)
  const paddingRight = parseInt(getStyleProperty(editorView.dom, 'paddingRight'), 10)
  const borderLeftWidth = parseInt(getStyleProperty(editorView.dom, 'borderLeftWidth'), 10)
  const borderRightWidth = parseInt(getStyleProperty(editorView.dom, 'borderRightWidth'), 10)
  const boundingClientRect = editorView.dom.getBoundingClientRect()

  return {
    left: clamp(
      left,
      boundingClientRect.left + paddingLeft + borderLeftWidth,
      boundingClientRect.right - paddingRight - borderRightWidth
    ),
    top,
  }
}

function getDragRange(event: MouseEvent, editor: Editor) {
  const { doc } = editor.view.state
  const node = findNodeAtPosition(
    {
      x: event.clientX,
      y: event.clientY,
      direction: 'right',
    },
    editor
  )

  if (!node.resultNode || node.pos === null) return []

  const clientX = event.clientX
  const editorPosition = calculateEditorPosition(editor.view, clientX, event.clientY)
  const selectionPos = editor.view.posAtCoords(editorPosition)
  if (!selectionPos) return []

  const { pos } = selectionPos
  if (!doc.resolve(pos).parent) return []

  const selectedNode = doc.resolve(node.pos)
  const nextNode = doc.resolve(node.pos + 1)
  return getSelectionRanges(selectedNode, nextNode, 0)
}

function getStartOfParentNode(doc: Doc, pos: number) {
  const resolvedPos = doc.resolve(pos)
  const { depth } = resolvedPos

  if (depth === 0) return pos
  return resolvedPos.pos - resolvedPos.parentOffset - 1
}

function getNodeAtDepth(doc: Doc, position: number) {
  const node = doc.nodeAt(position)
  const resolvedPos = doc.resolve(position)
  let { depth } = resolvedPos
  let targetNode = node

  while (depth > 0) {
    const currentNode = resolvedPos.node(depth)
    depth -= 1
    if (depth === 0) {
      targetNode = currentNode
    }
  }

  return targetNode
}

function findClosestAncestorInView(editorView: EditorView, element: Element | null) {
  let currentElement = element

  while (currentElement && currentElement.parentNode && currentElement.parentNode !== editorView.dom) {
    currentElement = currentElement.parentNode as Element
  }

  return currentElement
}

function createDragElement(editor: Editor, selection: SelectionRange[]) {
  const dragElement = document.createElement('div')

  selection.forEach((range) => {
    const originalChild = editor.view.nodeDOM(range.$from.pos) as HTMLElement
    const child = deepClone(originalChild)
    dragElement.append(child)
  })

  dragElement.style.position = 'absolute'
  dragElement.style.top = '-10000px'
  document.body.append(dragElement)

  return dragElement
}

function handleDragEvent(event: DragEvent, editor: Editor) {
  if (!event.dataTransfer) return

  const { view } = editor
  const { empty, $from: selectionFrom, $to: selectionTo } = view.state.selection
  const adjustedSelection = getDragRange(event, editor)
  const selectionRanges = getSelectionRanges(selectionFrom, selectionTo, 0)
  const hasOverlap = selectionRanges.some((range) =>
    adjustedSelection.find((t) => t.$from === range.$from && t.$to === range.$to)
  )
  const finalSelection = empty || !hasOverlap ? adjustedSelection : selectionRanges
  if (!finalSelection.length) return

  const dragElement = createDragElement(editor, finalSelection)
  event.dataTransfer.clearData()
  event.dataTransfer.setDragImage(dragElement, 0, 0)

  const startPos = finalSelection[0].$from.pos
  const endPos = finalSelection[finalSelection.length - 1].$to.pos
  const rangeSelection = NodeRangeSelection.create(view.state.doc, startPos, endPos)
  const rangeSelectionContent = rangeSelection.content()
  view.dragging = { slice: rangeSelectionContent, move: true }

  const { tr } = view.state
  tr.setSelection(rangeSelection)
  view.dispatch(tr)

  document.addEventListener('drop', () => removeElementFromParent(dragElement), {
    once: true,
  })
}

const dragHandlePluginDefaultKey = new PluginKey('dragHandle')

// eslint-disable-next-line max-lines-per-function
const DragHandlePlugin = ({
  pluginKey = dragHandlePluginDefaultKey,
  dragHandleEl,
  editor,
  onNodeChange,
  excludedTags = [],
}: {
  pluginKey?: PluginKey | string
  dragHandleEl: HTMLElement
  editor: Editor
  tippyOptions?: any
  onNodeChange?: (arg0: { editor: any; node: any; pos: number }) => void
  excludedTags?: string[]
}) => {
  const dragHandleContainerEl = document.createElement('div')
  let isDraggable = false
  let trackedNode: Node | null = null
  let trackedPos = -1

  dragHandleEl.addEventListener('dragstart', (event) => {
    handleDragEvent(event, editor)

    setTimeout(() => {
      dragHandleEl.style.pointerEvents = 'none'
    }, 0)
  })

  dragHandleEl.addEventListener('dragend', () => {
    dragHandleEl.style.pointerEvents = 'auto'
  })

  return new Plugin({
    key: typeof pluginKey === 'string' ? new PluginKey(pluginKey) : pluginKey,
    state: {
      init: () => ({ locked: false }),
      apply(transaction, value, _oldState, _newState) {
        const lockDragHandle = transaction.getMeta('lockDragHandle')
        const hideDragHandle = transaction.getMeta('hideDragHandle')

        if (lockDragHandle !== undefined) {
          isDraggable = lockDragHandle
        }

        if (hideDragHandle) {
          dragHandleContainerEl.style.display = 'none'
          isDraggable = false
          trackedNode = null
          trackedPos = -1

          onNodeChange?.({ editor, node: null, pos: -1 })
          return value
        }

        if (transaction.docChanged && trackedPos !== -1 && dragHandleEl) {
          const newPos = transaction.mapping.map(trackedPos)
          if (newPos !== trackedPos) {
            trackedPos = newPos
          }
        }

        return value
      },
    },
    view: (editorView) => {
      // Enable dragging and pointer events for the element
      dragHandleEl.draggable = true
      dragHandleEl.style.pointerEvents = 'auto'

      // Append wrapper and set styles
      editor.view.dom.parentElement?.appendChild(dragHandleContainerEl)
      dragHandleContainerEl.appendChild(dragHandleEl)
      dragHandleContainerEl.style.pointerEvents = 'none'
      dragHandleContainerEl.style.position = 'absolute'
      dragHandleContainerEl.style.display = 'none'
      dragHandleContainerEl.style.top = '0px'
      dragHandleContainerEl.style.left = '0px'

      // Return update and destroy handlers for the view
      return {
        update(view, prevState) {
          if (!dragHandleEl || excludedTags.includes(dragHandleEl.tagName)) return
          if (dragHandleEl.draggable === !isDraggable || editorView.state.doc.eq(prevState.doc) || trackedPos === -1)
            return

          const targetElement = findClosestAncestorInView(editorView, editorView.nodeDOM(trackedPos) as Element)
          if (!targetElement || targetElement === editorView.dom || targetElement?.nodeType !== 1) return

          const domPos = editorView.posAtDOM(targetElement, 0)
          const parentNode = getNodeAtDepth(editor.state.doc, domPos)
          const parentPos = getStartOfParentNode(editor.state.doc, domPos)

          trackedNode = parentNode
          trackedPos = parentPos
          onNodeChange?.({ editor, node: trackedNode, pos: trackedPos })
          positionTooltip(targetElement, dragHandleContainerEl)
        },
        destroy() {
          if (dragHandleEl) removeElementFromParent(dragHandleContainerEl)
        },
      }
    },
    props: {
      handleDOMEvents: {
        mouseleave: (editorView, event) => {
          if (!isDraggable) {
            const offsetThreshold = 20
            const target = event.relatedTarget as HTMLElement

            if (event.target && !dragHandleContainerEl.contains(target)) {
              const mouseX = event.clientX
              const mouseY = event.clientY

              const handleRect = dragHandleContainerEl.getBoundingClientRect()
              const offsetX = Math.abs(mouseX - (handleRect.left + handleRect.width / 2))
              const offsetY = Math.abs(mouseY - (handleRect.top + handleRect.height / 2))

              // Check if the mouse is outside the offset threshold for both axes
              const isOutsideOffset = offsetX > offsetThreshold || offsetY > offsetThreshold
              if (isOutsideOffset) {
                // Hide tooltip and reset state
                dragHandleContainerEl.style.display = 'none'
                trackedNode = null
                trackedPos = -1

                onNodeChange?.({ editor, node: null, pos: -1 })
              }
            }
          }

          return false
        },
        mousemove(editorView, event) {
          if (!dragHandleEl || excludedTags.includes(dragHandleEl.tagName) || isDraggable) return false

          const hoverPosition = { x: event.clientX, y: event.clientY, direction: 'right' }
          const editorNode = findNodeAtPosition(hoverPosition, editor)

          if (!editorNode.resultElement) return false

          // Find the closest ancestor in the editor view
          const targetElement = findClosestAncestorInView(editorView, editorNode.resultElement)
          if (
            !targetElement ||
            targetElement === editorView.dom ||
            excludedTags.includes(targetElement.tagName?.toLowerCase()) ||
            targetElement.nodeType !== 1
          ) {
            return false
          }

          // Get the document position and node details
          const docPos = editorView.posAtDOM(targetElement, 0)
          const parentNode = getNodeAtDepth(editor.state.doc, docPos)

          // If the hovered node is different, update the tooltip and state
          if (parentNode !== trackedNode) {
            const parentPos = getStartOfParentNode(editor.state.doc, docPos)
            trackedNode = parentNode
            trackedPos = parentPos

            onNodeChange?.({ editor, node: parentNode, pos: trackedPos })
            positionTooltip(targetElement, dragHandleContainerEl, { placement: 'left-start' }).then(() => {
              dragHandleContainerEl.style.display = 'block'
            })
          }
          return false
        },
      },
    },
  })
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dragHandle: {
      lockDragHandle: () => ReturnType
      unlockDragHandle: () => ReturnType
      toggleDragHandle: () => ReturnType
    }
  }
}

interface Config {
  excludedTags?: string[]
  locked: boolean
  onNodeChange: (args: { editor: any; node: any; pos: number }) => void
  render: () => HTMLElement
}

/**
 * Extension that adds a drag handle to the editor.
 * It's based off of the `DragHandle` extension from @tiptap-pro.
 */
const DragHandle = new Extension<Config, any>({
  name: 'dragHandle',

  addOptions: () => ({
    render() {
      const dragHandleEl = document.createElement('div')
      dragHandleEl.classList.add('drag-handle')
      return dragHandleEl
    },
    locked: false,
    onNodeChange: () => null,
    excludedTags: [],
  }),

  addCommands() {
    return {
      lockDragHandle:
        () =>
        ({ editor }) => {
          this.options.locked = true
          return editor.commands.setMeta('lockDragHandle', this.options.locked)
        },
      unlockDragHandle:
        () =>
        ({ editor }) => {
          this.options.locked = false
          return editor.commands.setMeta('lockDragHandle', this.options.locked)
        },
      toggleDragHandle:
        () =>
        ({ editor }) => {
          this.options.locked = !this.options.locked
          return editor.commands.setMeta('lockDragHandle', this.options.locked)
        },
    }
  },

  addProseMirrorPlugins() {
    const { render, onNodeChange, excludedTags } = this.options
    const dragHandleEl = render()

    return [
      DragHandlePlugin({
        editor: this.editor,
        dragHandleEl,
        onNodeChange,
        excludedTags,
      }),
    ]
  },
})

export default DragHandle
