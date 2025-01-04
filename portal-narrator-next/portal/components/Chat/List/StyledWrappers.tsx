import { Card } from 'antd-next'
import { IMessage } from 'portal/stores/chats'
import styled from 'styled-components'
import { colors } from 'util/constants'

const getColor = ({ message }: { message?: IMessage }) => {
  if (message === undefined) return colors.mavis_light_gray
  if (message.rating === 1) return colors.green500
  if (message.request_id !== null) return colors.red500
  return colors.mavis_light_gray
}

const getPadding = ({ message }: { message?: IMessage }) => {
  if (message === undefined) return '0px'
  if (message.rating === 1 || message.request_id !== null) return '16px'
  return '0px'
}

const StyledCard = styled(Card)<{ message?: IMessage }>`
  background: white;
  border-radius: 8px;
  border: 1px solid ${getColor};
`

const StyledContainer = styled.div<{ message?: IMessage }>`
  padding: ${getPadding};
  border-radius: 8px;
  border: 1px solid ${getColor};
`

const StyledContent = styled.div`
  display: inline-block;
  position: relative;
  background: white;
  padding: 8px 12px;
  color: black !important;
  border-radius: 8px;
  border: 1px solid ${getColor};

  /** A hack to override the styles set at the MarkdownRenderer component */
  * {
    font-size: 1em !important;
  }

  p {
    margin-bottom: 0 !important;

    & + p {
      margin-top: 1em !important;
    }
  }
`

export { StyledCard, StyledContainer, StyledContent }
