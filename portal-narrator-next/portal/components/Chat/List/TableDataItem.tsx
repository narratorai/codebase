import { IMessage } from 'portal/stores/chats'

import DatasetTabs from '../Dataset/DatasetTabs'
import { StyledCard } from './StyledWrappers'
interface Props {
  chatId: string
  message: IMessage
}

const TableDataItem = ({ chatId, message }: Props) => (
  <StyledCard message={message}>
    <DatasetTabs chatId={chatId} message={message} isTableData />
  </StyledCard>
)

export default TableDataItem
