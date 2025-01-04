import { IRemoteChatMessage } from '@/stores/chats'

interface Props {
  message: IRemoteChatMessage
}

const ErrorItem = ({ message }: Props) => {
  return <div>ErrorItem: {message.id as string}</div>
}

export default ErrorItem
