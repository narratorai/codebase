import { IMessage } from 'portal/stores/chats'

import CustomerJourneyData from './CustomerJourneyData/CustomerJourneyData'
import { StyledContainer } from './StyledWrappers'
interface Props {
  message: IMessage
}

const CustomerJourneyDataItem = ({ message }: Props) => (
  <StyledContainer message={message}>
    <CustomerJourneyData message={message} />
  </StyledContainer>
)

export default CustomerJourneyDataItem
