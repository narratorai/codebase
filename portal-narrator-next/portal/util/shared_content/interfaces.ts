import {
  COPIED_PLOT_CONTENT_TYPE,
  COPIED_METRIC_CONTENT_TYPE,
  COPIED_TABLE_CONTENT_TYPE,
} from 'util/shared_content/constants'

export interface CopiedPlotContent {
  id: string
  type: typeof COPIED_PLOT_CONTENT_TYPE
  data: {
    dataset_slug: string
    group_slug: string
    plot_slug: string
  }
}

export interface CopiedMetricContent {
  id: string
  type: typeof COPIED_METRIC_CONTENT_TYPE
  data: {
    dataset_slug: string
    group_slug: string
    column_id: string
  }
}

export interface CopiedTableContent {
  id: string
  type: typeof COPIED_TABLE_CONTENT_TYPE
  data: {
    dataset_slug: string
    group_slug: string
    as_data_table: boolean
    limit?: number | null
    title?: string | null
  }
}
