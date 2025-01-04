import ChatMessageFeedback from '@/components/chats/ChatMessageFeedback'
import CodeEditor from '@/components/shared/CodeEditor'
import { IRemoteChatMessage } from '@/stores/chats'

import ChatMessageLoading from './ChatMessageLoading'

interface Props {
  message: IRemoteChatMessage
  showFeedback?: boolean
}

const JSONItem = ({ message, showFeedback }: Props) => {
  const value = JSON.stringify(message, null, 2)
  const { id, isComplete, loading, rating, requestId } = message

  return (
    <div className="space-y-2">
      <div className="space-y-4 rounded-xl bg-gray-50/50 p-4 bordered-gray-200">
        <div className="rounded-lg bg-white p-4 bordered-gray-200">
          <CodeEditor disabled height={400} language="json" value={value} />
        </div>
        {!isComplete && <ChatMessageLoading {...loading} />}
      </div>
      {showFeedback && <ChatMessageFeedback messageId={id} rating={rating} requestId={requestId} />}
    </div>
  )
}

export default JSONItem
