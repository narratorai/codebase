import {
  AreaConfig,
  BarConfig,
  ColumnConfig,
  DualAxesConfig,
  FunnelConfig,
  LineConfig,
  PieConfig,
  RoseConfig,
  SankeyConfig,
  ScatterConfig,
  TinyAreaConfig,
} from '@ant-design/charts'

export type AntVPlotTypes =
  | 'line'
  | 'column'
  | 'bar'
  | 'pie'
  | 'scatter'
  | 'area'
  | 'rose'
  | 'dual-axes'
  | 'funnel'
  | 'sankey'
  | 'tiny-area'

export interface ExtraAntVPlotCongfigs {
  meta: Record<
    string,
    {
      alias: string
      narrator_format?: string
    }
  >
  title?: {
    text: string
    visible: boolean
  }
  xAxis: {
    label: {
      narrator_format?: string
    }
  }
  yAxis: {
    label: {
      narrator_format?: string
    }
    [key: string]: any
  }
  label: {
    narrator_format?: string
    format_field?: string
  }
  tooltip: {
    narrator_format?: string
    narrator_formats?: string[]
  }
  slider?: {
    start: number
    end: number
    narrator_format?: string
  }
  geometryOptions?: {
    color: string
    geometry: string
    label: {
      narrator_format?: string
      format_field?: string
    }
  }[]
}

export type AntVPlotConfigs =
  | (ExtraAntVPlotCongfigs & LineConfig)
  | (ExtraAntVPlotCongfigs & ColumnConfig)
  | (ExtraAntVPlotCongfigs & BarConfig)
  | (ExtraAntVPlotCongfigs & PieConfig)
  | (ExtraAntVPlotCongfigs & ScatterConfig)
  | (ExtraAntVPlotCongfigs & AreaConfig)
  | (ExtraAntVPlotCongfigs & RoseConfig)
  | (ExtraAntVPlotCongfigs & DualAxesConfig)
  | (ExtraAntVPlotCongfigs & FunnelConfig)
  | (ExtraAntVPlotCongfigs & SankeyConfig)
  | (ExtraAntVPlotCongfigs & TinyAreaConfig)
