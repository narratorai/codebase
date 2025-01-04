import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import React from 'react'

interface Props {
  // TODO: Remove the event argument
  onClick: (event: unknown) => void
  children: React.ReactNode
}

const OutlinedAddButton = ({ onClick, children }: Props) => {
  return (
    <Button type="dashed" shape="round" icon={<PlusOutlined />} onClick={(event) => onClick(event)}>
      {children}
    </Button>
  )
}

export default OutlinedAddButton
