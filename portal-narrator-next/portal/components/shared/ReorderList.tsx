import { MoreOutlined } from '@ant-design/icons'
import { List } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import withScrolling from 'react-dnd-scrolling'
import { UseFieldArrayMove } from 'react-hook-form'

import ListItem from './ListItem'

interface Props {
  moveItem: UseFieldArrayMove
  items: {
    id: string
    index: number
    component: React.ReactElement
  }[]
  listStyle?: { [key: string]: string }
}

const ScrollingComponent = withScrolling('div')

const ReorderList = ({ moveItem, items, listStyle }: Props) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Typography mb={3}>Drag and drop columns to set their order</Typography>

      <ScrollingComponent style={{ ...listStyle }}>
        <List
          size="small"
          header={undefined}
          footer={undefined}
          dataSource={items}
          renderItem={(item, index) => (
            <ListItem key={item.id} index={index} id={item.id} moveItem={moveItem}>
              <Flex>
                <Box mr={2}>
                  <MoreOutlined />
                </Box>

                {item.component}
              </Flex>
            </ListItem>
          )}
        />
      </ScrollingComponent>
    </DndProvider>
  )
}

export default ReorderList
