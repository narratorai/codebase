import {
  Area,
  AreaConfig,
  Bar,
  BarConfig,
  Column,
  ColumnConfig,
  DualAxes,
  DualAxesConfig,
  Funnel,
  FunnelConfig,
  Line,
  LineConfig,
  Pie,
  PieConfig,
  Rose,
  RoseConfig,
  Scatter,
  ScatterConfig,
  TinyArea,
  TinyAreaConfig,
} from '@ant-design/charts'
import { isEmpty } from 'lodash'

import EmptyState from '@/components/primitives/EmptyState'
import { ChartType, IRemotePlotConfig } from '@/stores/datasets'

import { usePlotConfig } from './hooks'

interface Props {
  chartType: ChartType
  height?: number
  plotConfig: IRemotePlotConfig
}

const PlotChart = ({ plotConfig, chartType, height }: Props) => {
  const config = usePlotConfig(plotConfig, chartType, height)

  if (isEmpty(plotConfig) || isEmpty(plotConfig.data)) return <EmptyState title="No data to display" />

  if (chartType === 'line') return <Line {...(config as LineConfig)} />
  if (chartType === 'column') return <Column {...(config as ColumnConfig)} />
  if (chartType === 'bar') return <Bar {...(config as BarConfig)} />
  if (chartType === 'pie') return <Pie {...(config as PieConfig)} />
  if (chartType === 'scatter') return <Scatter {...(config as ScatterConfig)} />
  if (chartType === 'funnel') return <Funnel {...(config as FunnelConfig)} />
  if (chartType === 'area') return <Area {...(config as AreaConfig)} />
  // @ts-expect-error - TODO: TinyAreaConfig is not compatible with Config
  if (chartType === 'tiny-area') return <TinyArea {...(config as TinyAreaConfig)} />
  if (chartType === 'rose') return <Rose {...(config as RoseConfig)} />
  if (chartType === 'dual-axes') return <DualAxes {...(config as DualAxesConfig)} />
  return null
}

export default PlotChart
