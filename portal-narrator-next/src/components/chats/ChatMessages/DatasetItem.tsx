import ChatMessageFeedback from '@/components/chats/ChatMessageFeedback'
import DatasetData from '@/components/chats/DatasetData'
import DatasetConfigView from '@/components/shared/DatasetConfigView'
import { IRemoteChatMessage, IRemoteDatasetData } from '@/stores/chats'

import ChatMessageLoading from './ChatMessageLoading'

interface Props {
  message: IRemoteChatMessage
  showFeedback?: boolean
}

const DatasetItem = ({ message, showFeedback }: Props) => {
  const data = message.data as IRemoteDatasetData
  const { id, isComplete, loading, rating, requestId } = message
  const { dataset, groupSlug, plotData, plotSlug, sql, tableData } = data

  return (
    <div className="space-y-2">
      <div className="space-y-4 rounded-xl bg-gray-50/50 p-4 bordered-gray-200">
        {dataset && <DatasetConfigView dataset={dataset} groupSlug={groupSlug} plotSlug={plotSlug} />}
        {(sql || tableData || plotData) && (
          <div className="rounded-lg bg-white p-4 text-sm bordered-gray-200">
            <DatasetData data={data} />
          </div>
        )}
        {!isComplete && <ChatMessageLoading {...loading} />}
      </div>
      {showFeedback && <ChatMessageFeedback messageId={id} rating={rating} requestId={requestId} />}
    </div>
  )
}

export default DatasetItem
