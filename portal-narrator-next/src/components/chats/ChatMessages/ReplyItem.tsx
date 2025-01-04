import ChatMessageFeedback from '@/components/chats/ChatMessageFeedback'
import MarkdownRenderer from '@/components/shared/MarkdownRenderer'
import { IRemoteChatMessage } from '@/stores/chats'

import ChatMessageLoading from './ChatMessageLoading'

interface Props {
  message: IRemoteChatMessage
  showFeedback?: boolean
}

const ReplyItem = ({ message, showFeedback }: Props) => {
  const { data, id, isComplete, loading, rating, requestId } = message

  return (
    <div className="space-y-2">
      <div className="space-y-4 rounded-xl bg-gray-50/50 p-4 bordered-gray-200">
        <div className="rounded-lg bg-white p-4 bordered-gray-200">
          {/* @ts-expect-error Add better types for data */}
          <MarkdownRenderer source={data.content} />
        </div>
        {!isComplete && <ChatMessageLoading {...loading} />}
      </div>
      {showFeedback && <ChatMessageFeedback messageId={id} rating={rating} requestId={requestId} />}
    </div>
  )
}

export default ReplyItem
