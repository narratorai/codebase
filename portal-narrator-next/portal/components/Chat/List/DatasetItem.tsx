import { IMessage } from 'portal/stores/chats'

import { IChatResponse } from '../Dataset/DatasetDefinitionSection'
import DatasetDefinitionSection from '../Dataset/DatasetDefinitionSection'
import { StyledCard } from './StyledWrappers'

interface Props {
  chatId: string
  message: IMessage
  isViewMode: boolean
  toggleMode: () => void
}

const DatasetItem = ({ chatId, message, isViewMode, toggleMode }: Props) => (
  <StyledCard message={message} style={{ minWidth: '100%' }}>
    <DatasetDefinitionSection
      chatId={chatId}
      message={message as IChatResponse}
      isViewMode={isViewMode}
      toggleMode={toggleMode}
    />
  </StyledCard>
)

export default DatasetItem
