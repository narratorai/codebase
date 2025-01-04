import clsx from 'clsx'
import ThumbsDownIcon from 'static/mavis/icons/thumbs-down.svg'

import Spin from '@/components/shared/Spin'
import { TooltipTrigger } from '@/components/shared/Tooltip'

import ChatMessageFeedbackTooltip from './Tooltip'

interface Props {
  disabled: boolean
  loading: boolean
  marked: boolean
  onClick: () => void
}

const ThumbsDownButton = ({ disabled, loading, marked, onClick }: Props) => (
  <ChatMessageFeedbackTooltip label="Send to human for help">
    <TooltipTrigger>
      <button
        className={clsx('button button-xs secondary outlined', { negative: marked })}
        disabled={disabled}
        onClick={onClick}
      >
        {loading && <Spin className="button button-xs button-icon" />}
        {!loading && <ThumbsDownIcon className="button button-xs button-icon" />}
      </button>
    </TooltipTrigger>
  </ChatMessageFeedbackTooltip>
)

export default ThumbsDownButton
