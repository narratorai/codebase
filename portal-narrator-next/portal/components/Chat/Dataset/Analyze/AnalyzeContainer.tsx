import { IMessage } from 'portal/stores/chats'

import Analyze from './Analyze'
import { useAnalysisUpdatesSubscription, useAnalyzePlot, useMessage, useToolTip } from './hooks'

interface Props {
  message: IMessage
}

const AnalyzeContainer = ({ message }: Props) => {
  useAnalysisUpdatesSubscription(message)
  const tooltipMessage = useToolTip(message)
  const { handleAnalyze, loading, disabled } = useAnalyzePlot(message)
  const { isActionable, isNotActionable, narrativeSlug } = useMessage(message)

  return (
    <Analyze
      isActionable={isActionable}
      isNotActionable={isNotActionable}
      tooltipMessage={tooltipMessage}
      loading={loading}
      disabled={disabled}
      handleAnalyze={handleAnalyze}
      narrativeSlug={narrativeSlug}
    />
  )
}

export default AnalyzeContainer
