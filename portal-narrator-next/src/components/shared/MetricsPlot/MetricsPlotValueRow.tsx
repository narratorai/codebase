import { Row } from '@/components/primitives/Axis'
import { Frame } from '@/components/primitives/Frame'
import { IRemoteMetricsPlot } from '@/stores/datasets'

import MetricsPlotComparisonValue from './MetricsPlotComparisonValue'
import MetricsPlotTicker from './MetricsPlotTicker'
import MetricsPlotValue from './MetricsPlotValue'

type Props = Pick<
  IRemoteMetricsPlot,
  'comparisonText' | 'comparisonValue' | 'format' | 'tickerFormat' | 'tickerValue' | 'value' | 'valueColor'
>

const MetricsPlotValueRow = ({
  comparisonText,
  comparisonValue,
  format,
  tickerFormat,
  tickerValue,
  value,
  valueColor,
}: Props) => {
  return (
    <Row gap="md" items="end">
      <MetricsPlotValue format={format} value={value} valueColor={valueColor} />
      <Frame bottom="sm">
        <Row gap="md" items="end">
          <MetricsPlotComparisonValue format={format} text={comparisonText} value={comparisonValue} />
          <MetricsPlotTicker format={tickerFormat} value={tickerValue} />
        </Row>
      </Frame>
    </Row>
  )
}

export default MetricsPlotValueRow
