import { CloseOutlined } from '@ant-design/icons'
import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledMenuItem = styled.div`
  padding-left: 0 !important;

  .close-icon {
    opacity: 0;
    padding: 4px;
    margin-right: 2px;
    border: 1px solid transparent;
    border-radius: 2px;
  }

  .close-icon:hover {
    background: ${colors.gray100};
    border-color: ${colors.gray300};
  }

  :hover .close-icon {
    opacity: 1;
  }
`

interface Props {
  itemId: string
  itemName: string
  onClose: (id: string) => void
}

const ClosableMenuItem = ({ itemId, itemName, onClose }: Props) => {
  const closeCallback = (e: React.MouseEvent) => {
    onClose(itemId)
    e.stopPropagation()
  }

  return (
    <StyledMenuItem>
      <CloseOutlined className="close-icon" style={{ fontSize: '11px' }} onClick={closeCallback} />
      {itemName}
    </StyledMenuItem>
  )
}

export default ClosableMenuItem
