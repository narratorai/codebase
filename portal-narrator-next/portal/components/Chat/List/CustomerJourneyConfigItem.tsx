import { IMessage } from 'portal/stores/chats'

import CustomerJourneyConfigSection from './CustomerJourneyConfig/CustomerJourneyConfigSection'
import { StyledCard } from './StyledWrappers'

interface Props {
  chatId: string
  message: IMessage
  isViewMode: boolean
  toggleMode: () => void
}

const CustomerJourneyConfigItem = ({ chatId, message, isViewMode, toggleMode }: Props) => (
  <StyledCard message={message}>
    <CustomerJourneyConfigSection message={message} chatId={chatId} isViewMode={isViewMode} toggleMode={toggleMode} />
  </StyledCard>
)

export default CustomerJourneyConfigItem
