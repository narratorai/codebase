import { Column } from '@/components/primitives/Axis'
import { Card, CardHeader } from '@/components/primitives/Card'
import { IRemoteMetricsPlot } from '@/stores/datasets'

import MetricsPlotTitle from './MetricsPlotTitle'
import MetricsPlotValueRow from './MetricsPlotValueRow'

type Props = IRemoteMetricsPlot

const MetricsPlot = ({
  align = 'left',
  comparisonText,
  comparisonValue,
  format,
  subtitle,
  tickerFormat,
  tickerValue,
  title,
  value,
  valueColor,
}: Props) => {
  const items = align === 'left' ? 'start' : align === 'right' ? 'end' : 'center'

  return (
    <Card>
      <CardHeader>
        <Column full gap="md" items={items}>
          <Column gap="sm" items={items}>
            <MetricsPlotTitle subtitle={subtitle} title={title} />
          </Column>
          <MetricsPlotValueRow
            comparisonText={comparisonText}
            comparisonValue={comparisonValue}
            format={format}
            tickerFormat={tickerFormat}
            tickerValue={tickerValue}
            value={value}
            valueColor={valueColor}
          />
        </Column>
      </CardHeader>
    </Card>
  )
}

export default MetricsPlot
