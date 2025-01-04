import { List } from 'antd-next'
import type { Identifier, XYCoord } from 'dnd-core'
import React, { useRef } from 'react'
import { DragSourceMonitor, useDrag, useDrop } from 'react-dnd'
import styled from 'styled-components'
import { colors } from 'util/constants'

const { Item } = List

const StyledItemContainer = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
  border: 1px solid ${colors.gray300};

  &:hover {
    cursor: grab;
  }
`

const DRAG_DROP_TYPE = 'drag-drop-type'

interface DragItem {
  index: number
  id: string
  type: string
}

interface Props {
  moveItem: (dragIndex: number, hoverIndex: number) => void
  index: number
  id: string
  children: React.ReactNode
}

/**
 * Largely inspired by:
 * https://codesandbox.io/s/github/react-dnd/react-dnd/tree/gh-pages/examples_ts/04-sortable/simple?from-embed=&file=/src/Container.tsx
 */
const ListItem = ({ id, index, moveItem, children }: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: DRAG_DROP_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_DROP_TYPE,
    item: () => {
      return { id, index }
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0 : 1
  drag(drop(ref))

  return (
    <StyledItemContainer ref={ref} style={{ opacity }} data-handler-id={handlerId} className="styled-item-container">
      <Item>{children}</Item>
    </StyledItemContainer>
  )
}

export default ListItem
