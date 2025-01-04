import { isNil } from 'lodash'

import RequestDialog from './RequestDialog'
import RequestLink from './RequestLink'
import ThumbsUpButton from './ThumbsUpButton'
import useFeedback from './useFeedback'

interface Props {
  messageId: string
  rating: number
  requestId: string | null
}

const ChatMessageFeedback = ({ messageId, rating, requestId }: Props) => {
  const { isSubmittingNegativeFeedback, isSubmittingPositiveFeedback, submitNegativeFeedback, submitPositiveFeedback } =
    useFeedback(messageId)
  const isPositiveFeedback = rating === 1
  const isNegativeFeedback = !isNil(requestId)

  const disabled =
    isPositiveFeedback || isNegativeFeedback || isSubmittingPositiveFeedback || isSubmittingNegativeFeedback

  return (
    <div className="w-full justify-end gap-2 flex-x">
      {!isNegativeFeedback && (
        <ThumbsUpButton
          disabled={disabled}
          loading={isSubmittingPositiveFeedback}
          marked={isPositiveFeedback}
          onClick={submitPositiveFeedback}
        />
      )}

      <RequestDialog
        disabled={disabled}
        loading={isSubmittingNegativeFeedback}
        marked={isNegativeFeedback}
        onSubmit={submitNegativeFeedback}
      />

      <RequestLink requestId={requestId} />
    </div>
  )
}

export default ChatMessageFeedback
