import { Card, Space, Typography } from 'antd-next'
import Image from 'next/image'
import MavisAILogoCircle from 'static/img/MavisAILogoCircle.png'
import styled from 'styled-components'
import { colors } from 'util/constants'

import InitialSuggestions from '../Suggestions/InitialSuggestions'

const StyledCard = styled(Card)`
  border-radius: 8px;
  text-align: center;
  padding: 64px;

  & div {
    max-width: 100% !important;
  }
`

const WelcomeToChat = () => {
  return (
    <StyledCard>
      <Space direction="vertical" size={48}>
        <Space direction="vertical" size={16}>
          <Image src={MavisAILogoCircle} alt="Mavis AI Logo" width={64} height={64} />
          <Space direction="vertical" size={2}>
            <Typography.Title level={2} style={{ color: colors.mavis_black, margin: '0' }}>
              Welcome to Mavis AI
            </Typography.Title>
            <Typography.Text style={{ color: colors.mavis_text_gray, margin: '0' }} strong>
              Mavis is designed to be your personal AI data analyst that answers your questions.
            </Typography.Text>
          </Space>
        </Space>
        <InitialSuggestions />
      </Space>
    </StyledCard>
  )
}

export default WelcomeToChat
