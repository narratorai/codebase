import { Flex } from 'components/shared/jawns'
import type { Identifier } from 'dnd-core'
import React, { Key, useRef } from 'react'
import { DragSourceMonitor, useDrag, useDrop } from 'react-dnd'

const DRAG_DROP_TYPE = 'drag-drop-type'

interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  index: React.Key
  moveNode: (dragIndex: React.Key, hoverIndex: React.Key) => void
}

interface DragItem {
  index: number
  id: Key | null
}

const DraggableTab = ({ index, children, moveNode }: DraggableTabPaneProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: DRAG_DROP_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover: (item: { index: React.Key }, monitor) => {
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      if (hoverBoundingRect) {
        // Get horizontal  middle
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2

        // Determine mouse position
        const clientOffset = monitor.getClientOffset()

        // Get pixels to the left
        const hoverClientX = clientOffset && clientOffset.x - hoverBoundingRect.left

        // Only perform the move when the mouse is within a small slice, 10px wide, starting from the
        // middle of the element.
        // Otherwise you can get stuck constantly swapping back and forth
        // when smaller tabs are dragged in the very middle of larger tabs
        if (hoverClientX && !(hoverClientX > hoverMiddleX && hoverClientX < hoverMiddleX + 10)) {
          return
        }
      }

      moveNode(item.index, index)
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_DROP_TYPE,
    item: { index },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // hide the original tab that is being dragged
  // (you still see the tab in your cursor's hand as you drag)
  const opacity = isDragging ? 0 : 1
  drag(drop(ref))

  return (
    <Flex ref={ref} data-handler-id={handlerId} style={{ opacity, marginRight: '2px' }}>
      {children}
    </Flex>
  )
}

export default DraggableTab
