import { IDatasetQueryDefinition, IDefinitionFormValue } from 'util/datasets/interfaces'
import { LoadingBarOption, INarrativeTableContent } from 'util/blocks/interfaces'
import { AntVPlotConfigs } from 'components/shared/AntVPlots/interfaces'

type CohortType = IDefinitionFormValue['cohort']
type AppendType = IDefinitionFormValue['append_activities']

export interface ColumnFilterOption {
  id: string
  column: {
    dropdown_label: string
    enrichment_table: null | string
    enrichment_table_column: null | string
    kpi_locked: boolean
    label: string
    mavis_type: string
    name: string
    opt_group?: string
    type: string
    values: { key: string; value: string }[]
  }
  activity_id: string
  label: string
  column_id: string | null
  opt_group: string
}

export interface ColumnFiltersAndOptions {
  visible: boolean
  selected_filters: any[]
  column_options: ColumnFilterOption[]
}

export interface DatasetExploreOptions {
  dataset_config: {
    slug: string | null
    group_slug: string | null
    plot_slug: string | null
  }
  loading_screen?: LoadingBarOption[]
  filter_column_options: ColumnFilterOption[]
  segment_by_options: ColumnFilterOption[]
  segment_bys: ColumnFilterOption[]
  selected_filters: any[]
  plot_kind: string
  plot_options: string[]
  time_filter: null | any
  time_resolution: string
  y_metric_options: ColumnFilterOption[]
  y_metrics: ColumnFilterOption[]
  output_kind: string | null
  cohort?: CohortType
  append_activities?: AppendType
  activity_stream?: {
    activity_stream?: string
  }
}

// DatasetExploreFormValue represents the form in the dom (react-hook-form)
// it's similar to DatasetExploreOptions - except using primitive types
// otherwise we run into typescript circular dep. issues
export interface DatasetExploreFormValue extends IDefinitionFormValue {
  dataset_config: {
    slug: string | null
    group_slug: string | null
    plot_slug: string | null
  }
  loading_screen?: string[]
  filter_column_options: { id: string }[]
  segment_by_options: { id: string }[]
  segment_bys: { id: string }[]
  selected_filters: any[]
  plot_kind: string
  plot_options: string[]
  time_filter: null | any
  time_resolution: string | null
  y_metric_options: { id: string }[]
  y_metrics: { id: string }[]
  output_kind: string | null
  activity_stream?: string
}

export interface ApplyFiltersResponse {
  is_actionable: boolean
  output_kind: 'plot' | 'table' | 'metric'
  plot_data: {
    data: AntVPlotConfigs['data']
    config: {
      dataset_name: string
      dataset_slug: string
      group_name: string
      group_slug: string
      plot_slug: string
      snapshot_time: string
      x_type: string
    }
  }
  metric_data: {
    title: string
    value: string
  }
  table_data: INarrativeTableContent
  staged_dataset?: IDatasetQueryDefinition
}
