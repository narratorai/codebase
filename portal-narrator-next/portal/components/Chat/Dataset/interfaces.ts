import { IDefinitionFormValue } from 'util/datasets/interfaces'

export enum PlotKind {
  LINE = 'line',
  BAR = 'bar',
  HORIZONTAL_BAR = 'horizontal_bar',
  STACK = 'stack',
  HORIZONTAL_BAR_STACK = 'horizontal_bar_stack',
  SCATTER = 'scatter',
  AREA = 'area',
  FUNNEL = 'funnel',
  ROSE = 'rose',
  PIE = 'pie',
  DONUT = 'donut',
}

export interface FormValue extends IDefinitionFormValue {
  activity_stream?: {
    activity_stream?: string
  }
  selected_filters: { operator: string }[]
  columns?: any[]
  filters?: any[]
  group_columns?: any[]
  group_filters?: any[]
  plot: {
    ys: string[]
    xs: string[]
    color_bys: string[]
    plot_kind?: PlotKind
  }
}
