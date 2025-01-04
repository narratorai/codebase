import ChatMessageFeedback from '@/components/chats/ChatMessageFeedback'
import CustomerJourney from '@/components/shared/CustomerJourney'
import CustomerJourneyConfigView from '@/components/shared/CustomerJourneyConfigView'
import { IRemoteChatMessage, IRemoteJourneyData } from '@/stores/chats'

import ChatMessageLoading from './ChatMessageLoading'

interface Props {
  message: IRemoteChatMessage
  showFeedback?: boolean
}

const CustomerJourneyItem = ({ message, showFeedback }: Props) => {
  const data = message.data as IRemoteJourneyData
  const { id, isComplete, loading, rating, requestId } = message
  const { attributes, config, journey } = data

  return (
    <div className="space-y-2">
      <div className="space-y-4 rounded-xl bg-gray-50/50 p-4 bordered-gray-200">
        <CustomerJourneyConfigView config={config} />
        <div className="h-[400px] overflow-y-auto rounded-lg bg-white bordered-gray-200">
          <CustomerJourney attributes={attributes} config={config} events={journey} />
        </div>
        {!isComplete && <ChatMessageLoading {...loading} />}
      </div>
      {showFeedback && <ChatMessageFeedback messageId={id} rating={rating} requestId={requestId} />}
    </div>
  )
}

export default CustomerJourneyItem
