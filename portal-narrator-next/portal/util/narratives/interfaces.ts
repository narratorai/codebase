import { IContent } from 'components/Narratives/interfaces'
import type narrativeFromTemplateMachine from 'machines/narrativeTemplates/narrativeFromTemplateMachine'
import { FieldConfig } from 'util/blocks/interfaces'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import { CONTENT_TYPE_IMAGE_UPLOAD, CONTENT_TYPE_MEDIA_UPLOAD } from 'util/narratives/constants'
import { StateFrom } from 'xstate'

export type BlockType =
  | 'markdown'
  | 'metric_v2'
  | 'plot_v2'
  | 'table_v2'
  | 'simple_plot'
  | 'narrative_plotter'
  | 'impact_calculator'
  | 'simple_metric'
  | 'raw_metric'
  | 'dataset_table'
  | 'raw_table'
  | 'csv_table'
  | 'analyze_simulator'
  | typeof CONTENT_TYPE_IMAGE_UPLOAD
  | typeof CONTENT_TYPE_MEDIA_UPLOAD

export interface BaseMapping {
  new_id: string | null
  old_id: string
  question: string
}

interface FeatureMapping extends BaseMapping {
  display_name: string | null
  allowed_types: string[]
}

export interface DatasetFeatureMapping extends FeatureMapping {
  _dataset_mapping_old_id: string
}

export interface TemplateDatasetConfig {
  name: string
  dataset: IDatasetQueryDefinition
  feature_mapping: FeatureMapping[]
  mapping: BaseMapping
}

// FIXME
// FIXME - is it activity_mappings or activity_mapping???????
// FIXME - is it word_mappings or word_mapping???????
// FIXME - is it feature_mappings or feature_mapping???????
// FIXME

export interface BaseNarrativeTemplateConfig {
  activity_mapping: BaseMapping[]
  datasets: TemplateDatasetConfig[]
  word_mappings: BaseMapping[]
  additional_context?: string
}

export interface INarrativeTemplateConfig extends BaseNarrativeTemplateConfig {
  // TODO: add types to the following:
  narrative: {
    datasets: any[]
    field_configs: FieldConfig[]
    narrative: INarrativeConfig
    _last_modified_at: string
  }
}

//////////////////////// Mavis API Response Types ////////////////////////

export interface FeatureOption {
  label: string
  value: string
}

export interface FeatureMappingOption {
  feature_mapping_old_id: string
  options: FeatureOption[]
}

export interface FeatureOptionsData {
  feature_mapping_options: FeatureMappingOption[]
}

export interface CreateNarrativeResponse {
  narrative_slug: string
  dataset_slugs: string[]
}
export interface ITemplateContext {
  machineCurrent: StateFrom<typeof narrativeFromTemplateMachine>
  machineSend: Function
}

export type NarrativeFields = Record<string, string | number | null>

export interface INarrativeConfig {
  question?: string
  goal?: string
  recommendation?: {
    title?: string
    explanation?: string
  }
  is_actionable?: boolean | string | number | null
  key_takeaways?: {
    explanation?: string
    title?: string
    value?: number
  }[]
  sections?: {
    id: string
    content?: IContent[]
    show?: boolean
    takeaway?: string | null
    title?: string | null
    _dashboard_layout_version?: number
  }[]
}

export interface IAssembledFieldsResponse {
  updated?: string[]
  refresh?: boolean
  fields?: NarrativeFields
  field_configs?: FieldConfig[]
  narrative?: INarrativeConfig
}

export interface IDependencyGraphResponse {
  branches: {
    id: string
    source: string
    target: string
  }[]
  nodes: {
    id: string
    data: {
      failed: boolean
      label: string
      kind: string
      node_kind: string
      unused: boolean
      value: string
      x_position: number
      y_position: number
    }
  }[]
}

export interface ITableColumnOrder {
  left: string[]
  right: string[]
  order: string[]
}
