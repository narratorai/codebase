import { IChatStore, IMessage, MessageTypes } from 'portal/stores/chats'
import useToggle from 'util/useToggle'

import Feedback from '../Feedback'
import AnimatedContainer from './AnimatedContainer'
import BrainstormConfigItem from './BrainstormConfigItem'
import ClassifiedQuestionItem from './ClassifiedQuestionItem'
import CustomerJourneyConfigItem from './CustomerJourneyConfigItem'
import CustomerJourneyDataItem from './CustomerJourneyDataItem'
import CustomerJourneyExamplesItem from './CustomerJourneyExamplesItem'
import DatasetItem from './DatasetItem'
import ErrorItem from './ErrorItem'
import JSONItem from './JSONItem'
import PlotDataItem from './PlotDataItem'
import StyledListItem from './StyledListItem'
import TableDataItem from './TableDataItem'
import TextItem from './TextItem'

interface Props {
  chat: IChatStore
  message: IMessage
  index: number
  readOnly?: boolean
}

const ChatListItem = ({ chat, message, index, readOnly = false }: Props) => {
  const { type } = message
  const chatId = chat?.id
  const [isViewMode, toggleIsViewMode] = useToggle(true)

  return (
    <StyledListItem>
      <AnimatedContainer index={index}>
        {type === MessageTypes.Error ? (
          <ErrorItem message={message} />
        ) : type === MessageTypes.Text ? (
          <TextItem message={message} />
        ) : type === MessageTypes.BrainstormConfig ? (
          <BrainstormConfigItem message={message} />
        ) : type === MessageTypes.CustomerJourneyConfig && chatId ? (
          <CustomerJourneyConfigItem
            message={message}
            chatId={chatId}
            isViewMode={isViewMode}
            toggleMode={toggleIsViewMode}
          />
        ) : type === MessageTypes.CustomerJourneyData && chatId ? (
          <CustomerJourneyDataItem message={message} />
        ) : type === MessageTypes.ExampleCustomerJourneys && chatId ? (
          <CustomerJourneyExamplesItem message={message} />
        ) : type === MessageTypes.ClassifiedQuestion && chatId ? (
          <ClassifiedQuestionItem message={message} />
        ) : type === MessageTypes.DatasetConfig && chatId ? (
          <DatasetItem chatId={chatId} message={message} isViewMode={isViewMode} toggleMode={toggleIsViewMode} />
        ) : type === MessageTypes.PlotData && chatId ? (
          <PlotDataItem chatId={chatId} message={message} />
        ) : type === MessageTypes.TableData && chatId ? (
          <TableDataItem chatId={chatId} message={message} />
        ) : (
          <JSONItem chatId={chatId} message={message} />
        )}
        <Feedback hideFeedback={readOnly} isViewMode={isViewMode} chatId={chatId} message={message} />
      </AnimatedContainer>
    </StyledListItem>
  )
}

export default ChatListItem
