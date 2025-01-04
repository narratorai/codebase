import { InfoCircleOutlined } from '@ant-design/icons'
import { Modal } from 'antd-next'
import { Box } from 'components/shared/jawns'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import React, { useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

interface InfoModalProps {
  markdown: string
}

const StyledInfoIcon = styled(Box)`
  color: ${colors.gray600};

  &:hover {
    color: ${colors.blue500};
  }
`

const InfoModal: React.FC<InfoModalProps> = ({ markdown }) => {
  const [visible, setVisible] = useState(false)

  const toggleVisible = (event: any) => {
    // in case the info icon is nested (i.e tab pane)
    // don't also open the tab
    event.stopPropagation()
    setVisible((prevVisible) => !prevVisible)
  }

  return (
    <Box>
      <StyledInfoIcon>
        <InfoCircleOutlined onClick={toggleVisible} />
      </StyledInfoIcon>

      <Modal open={visible} footer={null} onCancel={toggleVisible} style={{ minWidth: '740px' }}>
        <Box p={2}>
          <MarkdownRenderer source={markdown} />
        </Box>
      </Modal>
    </Box>
  )
}

export default InfoModal
