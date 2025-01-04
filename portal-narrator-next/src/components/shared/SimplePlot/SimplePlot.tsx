import { Column, Row } from '@/components/primitives/Axis'
import DatasetOptions from '@/components/shared/DatasetOptions'
import PlotChart from '@/components/shared/PlotChart'
import { IRemoteSimplePlot } from '@/stores/datasets'

import SimplePlotTitle from './SimplePlotTitle'

const SimplePlot = ({ chartType, config, height, plotConfig }: IRemoteSimplePlot) => {
  const { title } = plotConfig

  return (
    <Column full gap="xl">
      <Row items="center" x="between">
        <SimplePlotTitle {...title} />
        <DatasetOptions {...config} />
      </Row>
      <PlotChart chartType={chartType} height={height} plotConfig={plotConfig} />
    </Column>
  )
}

export default SimplePlot
