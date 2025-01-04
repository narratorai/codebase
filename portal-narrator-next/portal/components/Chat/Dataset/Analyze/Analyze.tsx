import { Flex } from 'antd-next'

import Actionable from './Actionable'
import AnalyzeButton from './AnalyzeButton'
import AnalyzeLink from './AnalyzeLink'
import NotActionable from './NotActionable'

interface Props {
  isActionable: boolean
  isNotActionable: boolean
  tooltipMessage: string | null
  loading: boolean
  disabled: boolean
  handleAnalyze: () => void
  narrativeSlug: string
}

const Analyze = ({
  isActionable,
  isNotActionable,
  tooltipMessage,
  loading,
  disabled,
  handleAnalyze,
  narrativeSlug,
}: Props) => (
  <Flex justify="end" align="center" gap={16}>
    {isActionable && <Actionable />}
    {isNotActionable && <NotActionable />}
    {!isActionable && !isNotActionable && (
      <AnalyzeButton tooltipMessage={tooltipMessage} loading={loading} disabled={disabled} onClick={handleAnalyze} />
    )}
    {narrativeSlug && <AnalyzeLink narrativeSlug={narrativeSlug} />}
  </Flex>
)

export default Analyze
