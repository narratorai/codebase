import { IRemoteAggregateDimension, IRemoteGroupColumn, IRemoteOrder, IRemoteParentFilterExpression } from '.'

export enum TabKind {
  Group = 'group',
  Parent = 'parent',
}

export enum HideShow {
  Hide = 'hide',
  Show = 'show',
}

export enum GroupMode {
  OverTime = 'over_time',
  MultiOverTime = 'multi_over_time',
  Numeric = 'numeric',
  Values = 'values',
  Metrics = 'metrics',
}

export enum AnnotationKind {
  Point = 'point',
  VerticalLine = 'vertical_line',
  HorizontalLine = 'horizontal_line',
  ColorYBelow = 'color_y_below',
  ColorYAbove = 'color_y_above',
  ColorXLeft = 'color_x_left',
  ColorXRight = 'color_x_right',
}

export enum Regression {
  Linear = 'linear',
  Exp = 'exp',
  Loess = 'loess',
  Log = 'log',
  Poly = 'poly',
  Pow = 'pow',
  Quad = 'quad',
}

export enum PlotKind {
  Line = 'line',
  Bar = 'bar',
  HorizontalBar = 'horizontal_bar',
  Stack = 'stack',
  HorizontalBarStack = 'horizontal_bar_stack',
  Scatter = 'scatter',
  Area = 'area',
  Funnel = 'funnel',
  Rose = 'rose',
  Pie = 'pie',
  Donut = 'donut',
}

export interface IRemoteAnnotation {
  color: string
  content: string
  kind: AnnotationKind
  xLocation: string | null
  yLocation: number | string
}

export interface IRemoteStatisticConfig {
  color: string
}

export interface IRemoteAxis {
  addAnimation: boolean
  addBrush: boolean
  addConversion: boolean
  addHoverHighlighting: boolean
  addRegressionLine: Regression
  addSliders: boolean
  addStatistics: boolean
  animationDuration: number
  autogenTitle: string | null
  clusterXValues: boolean
  hiddenValues: string[]
  hideLegend: boolean
  highlightOnLegend: boolean
  isPercent: boolean
  limitRows: number | null
  overideThemeColors: boolean
  plotColors: string[]
  plotKind: PlotKind
  replace01WithDid: boolean
  sharedHover: boolean
  showLabels: boolean
  sliderEnd: number
  sliderStart: number
  smooth: boolean
  statisticConfig: IRemoteStatisticConfig
  title: string | null
  xAxis: string | null
  y2Axis: string | null
  y2Color: string
  y2LineDash: boolean
  yAxis: string | null
  yEnd: number | null
  yLog: boolean
  yStart: number | null
}

export interface IRemoteSelectedColumn {
  colorBys: string[]
  xs: string[]
  y2: string | null
  y2Available: boolean
  ys: string[]
}

export interface IRemotePlotDefinition {
  annotations: IRemoteAnnotation[]
  axes: IRemoteAxis
  columns: IRemoteSelectedColumn
  question: string
}

export interface IRemoteHideShow {
  columnIds: string[]
  mode: HideShow
}

export interface IRemoteTabPlot {
  config: IRemotePlotDefinition
  name: string
  slug: string
}

export interface IRemoteColumnUI {
  id: string
}

export interface IRemoteTabUI {
  columns: IRemoteColumnUI[]
}

export interface IRemoteTab {
  aggregate_dims: IRemoteAggregateDimension[]
  columns: IRemoteGroupColumn[]
  dataMode: GroupMode | null
  hideShow: IRemoteHideShow | null
  kind: TabKind
  label: string
  order: IRemoteOrder[]
  parentFilters: IRemoteParentFilterExpression | null
  plots: IRemoteTabPlot[]
  slug: string
  tabUi: IRemoteTabUI | null
}
