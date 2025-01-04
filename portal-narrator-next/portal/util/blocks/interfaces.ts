import { ObjectFieldTemplateProps, UiSchema } from '@rjsf/core'
import { JSONSchema7 } from 'json-schema'
import { INotification } from 'util/datasets/interfaces'
import { GetFileAPIReturn } from 'components/Narratives/interfaces'
import { ITableColumnOrder } from 'util/narratives/interfaces'
import { CONTENT_TYPE_METRIC_V2, CONTENT_TYPE_PLOT_V2, CONTENT_TYPE_TABLE_V2 } from 'util/narratives/constants'
import { ICompany_Table } from 'graph/generated'

//
// Service used to support getting schemas, submitting a form, etc
//

export interface LoadingBarProps {
  duration: number
  percent: number
  text: string
}

export interface RefreshConfig {
  field_slug?: string
  process_data?: boolean
  update_schema?: boolean
  submit_form?: boolean
  runImmediately?: boolean
  loading_bar?: LoadingBarProps[]
}

export interface IFormContext {
  onRefreshConfigRequest?: (refreshConfig: RefreshConfig) => void
  subscribeToRefresh?: ({
    fieldSlug,
    graphQuery,
    variables,
  }: {
    fieldSlug: string
    graphQuery: string
    variables: any
  }) => void
  version: number
}

export interface BlockService {
  loadSchemas({ asAdmin }: { asAdmin?: boolean }): Promise<IBlockOptions | undefined>
  submitForm(schemaSlug: string, data: DataSubmitBody, asAdmin?: boolean): Promise<BlockContent[]>
  // schema v1 endponts:
  loadBlock(body?: UpdateSchemaSubmitBody): Promise<UpdateSchemaResponse>
  updateSchema(schemaSlug: string, body?: UpdateSchemaSubmitBody, asAdmin?: boolean): Promise<UpdateSchemaResponse>
  processData(schemaSlug: string, body: ProcessDataSubmitBody, asAdmin?: boolean): Promise<ProcessDataResponse>
  loadItemContextById(id: string, resourceType: ResourceType, asAdmin?: boolean): Promise<UpdateSchemaResponse>
  loadDropdown(schemaSlug: string, body: ProcessDataSubmitBody, asAdmin?: boolean): Promise<LoadDropdownResponse>
}

// for loadItemContextById mavis api paths ex: v1/${resourceType}:
export type ResourceType = 'transformation' | 'activities'

export interface IBlockState {
  id: string
  resourceType: ResourceType
}

export interface LoadingBarOption {
  percent: number
  text: string
  duration: number
}

// What we get back as a list of potential blocks to select:
export interface GenericBlockOption {
  slug: string
  title: string
  version: number
  description?: string
  advanced: boolean
}

export type IBlockOptions = {
  [key in
    | 'blocks'
    | 'field_blocks'
    | 'narrative_blocks'
    | 'production_blocks'
    | 'field_loading_screen'
    | 'empty_dashboard'
    | 'empty_narrative']?: GenericBlockOption[] | LoadingBarOption[] | GetFileAPIReturn | null
}

// todo: this should be better specified
export type FormData = any

export interface FormSchema {
  schema: JSONSchema7
  ui_schema?: UiSchema
}

// Similar to IChangeEvent but formData --> data
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-jsonschema-form/index.d.ts
export interface FormState extends FormSchema {
  data: FormData
  internal_cache?: { [key: string]: any } // owned by the backend - we send it back to give it some context
}

export interface SubmitResult {
  content: BlockContent[]
  formData: FormData
}

export interface HandleRefreshStateArgs {
  field_slug: string
  update_schema: boolean
  process_data: boolean
  submit_form: boolean
  formData: FormData
  disableLoading?: boolean
  loading_bar?: LoadingBarProps[]
}

export interface UpdateSchemaSubmitBody {
  // technically we don't need any of these (including an empty body will intiialize an empty form)
  data?: FormData
  field_slug?: string
  block_slug?: string
  internal_cache?: { [key: string]: any }
  fields?: Record<string, unknown>[]
}

export type UpdateSchemaResponse = FormState

export interface CallBackResponse {
  type: string
  value: BlockContent[]
}

export interface ProcessDataSubmitBody {
  field_slug: string
  data: FormData
}

export interface ProcessDataResponse {
  data: FormData
  redirect_url?: string
  notification?: INotification
  dirty?: boolean
  show_beacon_id?: string
  confetti?: boolean
}

export type ProcessedResult = Omit<ProcessDataResponse, 'data'>

export type FieldValue = number | string
export type SelectOption = { value: FieldValue; label?: string }

export interface LoadDropdownResponse {
  data: {
    values: SelectOption[]
  }
}

export interface DataSubmitBody {
  data: FormData
}

export interface MarkdownContent {
  type: 'markdown'
  value: string
  text?: string
}

export interface TextContent {
  type: 'text'
  value: string
}

export interface JsonContent {
  type: 'json'
  value: {
    [key: string]: any
  }
}

export interface PlotContent {
  id: string
  type: 'plot' | 'block_plot' | typeof CONTENT_TYPE_PLOT_V2
  value: {
    data: { [key: string]: any }[]
    layout: {
      [key: string]: any
    }
    config: {
      [key: string]: any
    }
    height?: number
  }
}

export interface INarrativeTableColumn {
  name: string
  friendly_name: string
  format: string
  pinned: 'left' | 'right' | null
  type: string
}

export interface INarrativeTableContentMetaData {
  title?: string
  url?: string
  customer_column?: string
  customer_kind?: string
  retrieved_at?: string
  table?: Partial<ICompany_Table>
}

export interface INarrativeTableContent {
  columns: INarrativeTableColumn[]
  rows: Record<string, any>[]
  metadata?: INarrativeTableContentMetaData
}

export interface TableContent {
  type: 'table' | typeof CONTENT_TYPE_TABLE_V2
  value: INarrativeTableContent
  column_order?: ITableColumnOrder
}

export interface ImpactCalculatorContent {
  type: 'impact_calculator' | 'impact_simulator'
  value: { [key: string]: any }
}

export interface RawMectricContent {
  type: 'raw_metric' | typeof CONTENT_TYPE_METRIC_V2
  value: { [key: string]: any }
}

export interface AnalyzeSimulatorContent {
  type: 'analyze_simulator'
  value: {
    default_shift_percent: number
    previous_names: string[]
    requester: {
      email: string
    }
    kpi_name: string
    current_kpi: number
    higher_is_good: boolean
    row_label: string
    shift_from_group: string
    shift_from_kpi: number
    shift_from_percent: number
    shift_to_group: string
    shift_to_percent: number
    shift_to_kpi: number
    _raw_fields: {}
    simulations: {
      percent_shift: number
      simulated_kpi: number
      lift: number
    }[]
  }
}

export type BlockContent =
  | MarkdownContent
  | JsonContent
  | TextContent
  | PlotContent
  | TableContent
  | ImpactCalculatorContent
  | RawMectricContent
  | AnalyzeSimulatorContent

export type BlockContentType =
  | 'markdown'
  | 'text'
  | 'json'
  | 'plot'
  | 'block_plot'
  | 'table'
  | 'impact_calculator'
  | 'raw_metric'
  | 'analyze_simulator'

//
// Support for ui:tabs ObjectFieldTemplate integration
//

export interface TabConfig {
  label: string
  property_names: string[]
  tab_id: string
  redirect_tab_ids: string[]
  'ui:info_modal'?: string
}

export interface TabsConfig {
  other_label?: string
  tabs: TabConfig[]
}

export interface GroupedTab {
  label: string
  properties: ObjectFieldTemplateProps['properties']
  tab_id: string
  redirect_tab_ids: string[]
}

export interface FieldConfig {
  name: string
  kind: string
  value: any
  format?: any
  explanation?: string
  unused?: boolean
  field_depends_on?: string[]
  previous_names?: string[]
}
