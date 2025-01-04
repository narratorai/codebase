import { DisplayFormat, IRemoteOutputConfig } from '.'

export enum PlotType {
  Simple = 'simple',
  Metrics = 'metrics',
}

export enum ChartType {
  Line = 'line',
  Column = 'column',
  Bar = 'bar',
  Pie = 'pie',
  Scatter = 'scatter',
  Funnel = 'funnel',
  Area = 'area',
  TinyArea = 'tiny-area',
  Rose = 'rose',
  DualAxes = 'dual-axes',
}

export interface IRemotePlotConfigTitle extends Record<string, unknown> {
  text: string
  visible: boolean
}

export interface IRemotePlotConfigFormat extends Record<string, unknown> {
  formatField?: string
  narratorFormat?: string
  narratorFormats?: string[]
}

export interface IRemotePlotConfigFormattedLabel extends Record<string, any> {
  label?: IRemotePlotConfigFormat
}

export interface IRemotePlotConfig extends Record<string, unknown> {
  geometryOptions?: IRemotePlotConfigFormattedLabel[]
  label: IRemotePlotConfigFormat
  meta: Record<string, IRemotePlotConfigFormat>
  slider?: IRemotePlotConfigFormat
  title?: IRemotePlotConfigTitle
  tooltip: IRemotePlotConfigFormat
  xAxis: IRemotePlotConfigFormattedLabel
  yAxis: IRemotePlotConfigFormattedLabel
}

export interface IRemoteSimplePlot {
  chartType: ChartType
  config: IRemoteOutputConfig
  height?: number
  plotConfig: IRemotePlotConfig
}

export interface IRemoteMetricsPlot {
  align?: 'left' | 'center' | 'right'
  comparisonText?: string | null
  comparisonValue?: number | string | null
  config: IRemoteOutputConfig
  format: DisplayFormat
  plotConfig?: IRemotePlotConfig // The chartType for this plotConfig is always ChartType.TinyArea
  subtitle?: string | null
  tickerFormat?: DisplayFormat
  tickerValue?: number | null
  title: string
  value: number | string | null
  valueColor: string
}

export interface IRemotePlot {
  plot: IRemoteSimplePlot | IRemoteMetricsPlot
  plotType: PlotType
}
