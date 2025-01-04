import MarkdownRenderer from '@/components/shared/MarkdownRenderer'
import { IRemoteChatMessage } from '@/stores/chats'

interface Props {
  message: IRemoteChatMessage
}

const TextItem = ({ message }: Props) => {
  const { data } = message

  return (
    <div className="rounded-xl bg-white p-4 text-sm bordered-gray-200">
      {/* @ts-expect-error Add better types for data */}
      <MarkdownRenderer source={data.text} />
    </div>
  )
}

export default TextItem
