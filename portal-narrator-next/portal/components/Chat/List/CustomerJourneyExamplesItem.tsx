import { IMessage } from 'portal/stores/chats'

import CustomerJourneyExamples from './CustomerJourneyExamples/CustomerJourneyExamples'
import { StyledContainer } from './StyledWrappers'

interface Props {
  message: IMessage
}

const CustomerJourneyExamplesItem = ({ message }: Props) => (
  <StyledContainer message={message}>
    <CustomerJourneyExamples message={message} />
  </StyledContainer>
)

export default CustomerJourneyExamplesItem
