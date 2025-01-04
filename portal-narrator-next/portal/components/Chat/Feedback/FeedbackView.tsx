import { ExportOutlined } from '@ant-design/icons'
import { Tag } from 'antd-next'
import { colors } from 'util/constants'

import FeedbackButton from './FeedbackButton'
import FeedbackWrapper from './FeedbackWrapper'

interface Props {
  rating?: number
  requestId?: string | null
}

const FeedbackView = ({ rating, requestId }: Props) => {
  return (
    <FeedbackWrapper>
      {rating === 1 ? (
        <Tag color={colors.green500} style={{ margin: '0' }}>
          Feedback Submitted
        </Tag>
      ) : (
        <Tag color={colors.red500} style={{ margin: '0' }}>
          Request Submitted
        </Tag>
      )}
      {requestId && (
        <FeedbackButton href={`/llms/requests/edit/${requestId}`} tooltip="View Request">
          <ExportOutlined />
        </FeedbackButton>
      )}
    </FeedbackWrapper>
  )
}

export default FeedbackView
