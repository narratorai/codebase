import Progress from '@/components/shared/Progress'
import Spin from '@/components/shared/Spin'

interface Props {
  message: string
  percent: number
}

const ChatMessageLoading = ({ message, percent }: Props) => {
  const working = percent < 100

  return (
    <div className="space-y-1">
      <div className="justify-between flex-x-center">
        <div className="badge badge-md tonal blue">
          {working && <Spin className="badge-icon" />}
          <span className="badge-label">
            {message}
            {working ? '...' : ''}
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-600">{percent}%</span>
      </div>
      <Progress percent={percent} />
    </div>
  )
}

export default ChatMessageLoading
