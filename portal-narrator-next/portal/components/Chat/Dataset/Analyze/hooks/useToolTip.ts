import { IMessage } from 'portal/stores/chats'

import useMessage from './useMessage'

const useToolTip = (message: IMessage): string | null => {
  const { isAnalyzable } = useMessage(message)

  const notAnalyzableMessage =
    'Non analyzable: You can only use analyze if the metric is an Average or a Rate and it is sliced by a column that is not time.'

  const tooltipMessage = isAnalyzable ? null : notAnalyzableMessage

  return tooltipMessage
}

export default useToolTip
