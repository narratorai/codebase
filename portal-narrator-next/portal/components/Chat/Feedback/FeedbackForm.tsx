import { LikeFilled, UserSwitchOutlined } from '@ant-design/icons'
import { Drawer } from 'antd-next'
import { MessageTypes } from 'portal/stores/chats'
import { colors } from 'util/constants'

import FeedbackButton from './FeedbackButton'
import FeedbackWrapper from './FeedbackWrapper'
import SendRequestForm from './SendRequestForm'

export const FEEDBACK_BUTTONS_CLASSNAME = 'feedback-buttons'

interface Props {
  showRequestForm: boolean
  messageType: MessageTypes
  toggleRequestForm: () => void
  postNegativeFeedback: () => Promise<void>
  postPositiveFeedback: () => Promise<void>
  sendRequest: (data: Record<string, unknown>) => Promise<void>
}

const FeedbackForm = ({
  showRequestForm,
  toggleRequestForm,
  postNegativeFeedback,
  postPositiveFeedback,
  sendRequest,
  messageType,
}: Props) => {
  return (
    <div>
      <FeedbackWrapper className={FEEDBACK_BUTTONS_CLASSNAME}>
        <FeedbackButton onClick={postNegativeFeedback} color={colors.red500} tooltip="Send to Human for help">
          <UserSwitchOutlined />
        </FeedbackButton>

        <FeedbackButton onClick={postPositiveFeedback} color={colors.green500}>
          <LikeFilled />
        </FeedbackButton>
      </FeedbackWrapper>

      <Drawer
        title="Request Human Review"
        placement="right"
        open={showRequestForm}
        onClose={toggleRequestForm}
        destroyOnClose
        width="50%"
        footer={null}
      >
        <SendRequestForm onSubmit={sendRequest} messageType={messageType} />
      </Drawer>
    </div>
  )
}

export default FeedbackForm
