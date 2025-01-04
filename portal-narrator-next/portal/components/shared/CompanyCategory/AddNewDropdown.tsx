import { PlusOutlined } from '@ant-design/icons'
import { Input } from 'antd-next'
import { Divider } from 'components/antd/staged'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import React, { ReactNode, useState } from 'react'
import { colors } from 'util/constants'

interface Props {
  menu: ReactNode
  onAddItem: (newItem: string) => void
}

/**
 * Component that renders a dropdown list and supports adding a new item
 */
const AddNewDropdown = ({ menu, onAddItem }: Props) => {
  const [newItem, setNewItem] = useState<any>()

  const handleChangeNewItem = (e: any) => {
    setNewItem(e.target.value)
  }

  const onInputEnter = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    handleAddItem()
  }

  const handleAddItem = () => {
    if (!isEmpty(newItem)) {
      onAddItem(newItem)
    }
  }

  return (
    <Box>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <Box style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
        <Input style={{ flex: 'auto' }} value={newItem} onChange={handleChangeNewItem} onPressEnter={onInputEnter} />
        <Typography
          // add color black so not overwritten by .ant-select-dropdown-empty
          style={{ flex: 'none', padding: '8px', display: 'block', cursor: 'pointer', color: colors.black }}
          onClick={handleAddItem}
        >
          <PlusOutlined /> Add item
        </Typography>
      </Box>
    </Box>
  )
}

export default AddNewDropdown
