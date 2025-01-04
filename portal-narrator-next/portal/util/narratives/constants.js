import { IStatus_Enum } from 'graph/generated'

export const CONTENT_TYPE_MARKDOWN = 'markdown'
export const CONTENT_TYPE_CUSTOM_PLOT = 'custom_plot'
export const CONTENT_TYPE_RAW_METRIC = 'raw_metric'
export const CONTENT_TYPE_ANALYZE_SIMULATOR = 'analyze_simulator'
export const CONTENT_TYPE_DATASET_METRIC = 'dataset_metric'
export const CONTENT_TYPE_BLOCK = 'block'

// V2 - basic options
export const CONTENT_TYPE_METRIC_V2 = 'metric_v2'
export const CONTENT_TYPE_PLOT_V2 = 'plot_v2'
export const CONTENT_TYPE_TABLE = 'table'
export const CONTENT_TYPE_TABLE_V2 = 'table_v2'
export const CONTENT_TYPE_IMAGE_UPLOAD = 'image_upload'
export const CONTENT_TYPE_MEDIA_UPLOAD = 'media_upload'
export const ALL_BASIC_CONTENT_TYPES = [
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MEDIA_UPLOAD,
]

// DEPRECATED:
export const CONTENT_TYPE_PLOT = 'plot' // deprecated
export const CONTENT_TYPE_BLOCK_PLOT = 'block_plot' // new hotness

export const ALL_PLOT_TYPES = [
  CONTENT_TYPE_CUSTOM_PLOT,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_PLOT,
  CONTENT_TYPE_BLOCK_PLOT,
]

export const DEFAULT_PLOT_OPTIONS = {
  layout: {
    title: {
      text: 'Sample Title',
    },
    xaxis: {
      title: {
        text: 'X Axis Title',
      },
    },
    yaxis: {
      title: {
        text: 'Y Axis Title',
      },
    },
  },
  column_ids: ['metrics_total_events'],
  column_labels: ['Total Events'],
}

export const DEFAULT_RAW_METRIC_CONFIG = {
  header: '',
  title: '',
  value: '',
  description: '',
  dataset_slug: '',
  group_slug: '',
}

export const DEFAULT_IMPACT_CALC_CONFIG = {
  calculator_type: 'revenue',
  from_activity_slug: 'started_session',
  from_cohort_percent: {
    distribution: '',
    label: '',
    rate: '',
  },
  other_cohort_percent: {
    distribution: '',
    label: 'Defalt Label',
    rate: 0.0,
  },
  to_cohort_percent: {
    distribution: '',
    label: '',
    rate: '',
  },
  total_from_activity_events: {
    day: '',
    month: '',
    week: '',
  },
}

export const NARRATIVE_STATE_LABELS = {
  [IStatus_Enum.Live]: 'Shared',
  [IStatus_Enum.InProgress]: 'Private',
  [IStatus_Enum.Archived]: 'Archived',
}

export const ASSEMBLED_NARRATIVE_TOP_BAR_HEIGHT = 56
export const ASSEMBLED_NARRATIVE_SUMMARY_OFFSET = 32
export const ASSEMBLED_NARRATIVE_SUMMARY_WIDTH = 180
