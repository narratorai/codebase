import { CopyOutlined } from '@ant-design/icons'
import { App, Tooltip } from 'antd-next'
import { IContent } from 'components/Narratives/interfaces'
import { Box } from 'components/shared/jawns'
import styled from 'styled-components'
import { setCopiedContentToLocalStorage } from 'util/shared_content/helpers'

const IconContainer = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`

interface Props {
  content: IContent
}

const CopyContentIcon = ({ content }: Props) => {
  const { notification } = App.useApp()

  const copyValue = () => {
    setCopiedContentToLocalStorage(content)

    notification.success({
      message: 'Content copied',
      placement: 'topRight',
      duration: 2,
    })
  }

  return (
    <Tooltip title="Copy Content">
      <IconContainer onClick={copyValue}>
        <CopyOutlined />
      </IconContainer>
    </Tooltip>
  )
}

export default CopyContentIcon
