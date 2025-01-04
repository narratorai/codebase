import { IMessage } from 'portal/stores/chats'

import FeedbackForm from './FeedbackForm'
import FeedbackView from './FeedbackView'
import useFeedback from './useFeedback'

interface Props {
  hideFeedback: boolean
  isViewMode: boolean
  chatId: string
  message: IMessage
}

const Feedback = ({ hideFeedback, isViewMode, chatId, message }: Props) => {
  const {
    showFeedbackView,
    showFeedbackForm,
    showRequestForm,
    requestId,
    rating,
    messageType,
    toggleRequestForm,
    postPositiveFeedback,
    postNegativeFeedback,
    sendRequest,
  } = useFeedback(hideFeedback, isViewMode, chatId, message)

  if (showFeedbackView) return <FeedbackView rating={rating} requestId={requestId} />
  if (showFeedbackForm)
    return (
      <FeedbackForm
        showRequestForm={showRequestForm}
        messageType={messageType}
        toggleRequestForm={toggleRequestForm}
        postPositiveFeedback={postPositiveFeedback}
        postNegativeFeedback={postNegativeFeedback}
        sendRequest={sendRequest}
      />
    )
  return null
}

export default Feedback
