import { INarrative } from 'graph/generated'
import { Layout } from 'react-grid-layout'
import { FieldConfig } from 'util/blocks/interfaces'
import { INarrativeConfig } from 'util/narratives/interfaces'

export interface INarrativeFile {
  key: string
  name: string
}

export interface DatasetConfig {
  slug: string
  group_slug: string
  snapshot: string
  snapshot_key: string
}

export interface DynamicFieldReturn {
  default_value: string | Record<string, any> | string[]
  name: string
  value_type: string | Record<string, any>
  value_options?: string[]
}

export interface GetFileAPIReturn {
  datasets?: Record<string, unknown>[]
  field_configs?: FieldConfig[]
  fields?: Record<string, unknown>
  narrative?: INarrativeConfig
  dynamic_fields?: DynamicFieldReturn[]
  applied_filters?: string[]
  _last_modified_at?: string
  dynamic_filters?: Record<string, unknown>[]
  upload_key?: string
}

export interface ITakeaway {
  title?: string
  explanation?: string
  value?: string | number
  conditioned_on?: boolean | string | number
}

export interface AssembleFieldsConfig {
  field_configs?: FieldConfig[]
  field_configs_changed?: FieldConfig[]
  fields?: Record<string, unknown>
  dynamic_filters?: Record<string, unknown>[]
}

export type TContentObject = Record<string, string | number | boolean | null>
export interface IContent {
  id?: string
  grid_layout?: Partial<Layout>
  type?: string
  block?: string
  text?: string
  condition?: boolean
  data?: TContentObject
}

export interface UpdateNarrativeMetaInput {
  narrative_id?: string
  name: string
  slug: string
  state: string
  description?: string
  category?: string
  schedule?: string
  requested_by?: string
  isEdit?: boolean
  depends_on?: string[]
  type?: string | null
  created_by: string
  tags?: string[]
  config?: GetFileAPIReturn
}

export interface DuplicateNarrativeInput {
  name: string
  id: string
  duplicate_datasets?: boolean
}

export interface UpdateNarrativeResponse {
  narrative_id: string
  narrative_slug: string
}

export interface INarrativeIndexContext {
  narratives?: INarrative[]
  handleOpenUpdateOverlay: (narrative: INarrative) => void
  handleOpenDeleteOverlay: (narrative: INarrative) => void
  handleOpenConfigOverlay: (narrative: INarrative) => void
  handleOpenDuplicateOverlay: (narrative: INarrative) => void
}
