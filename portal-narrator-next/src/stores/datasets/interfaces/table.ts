import { DisplayFormat } from '.'

export enum Comparator {
  Always = 'always',
  Contains = 'contains',
  StartsWith = 'starts_with',
  EndsWith = 'ends_with',
  GreaterThan = 'greater_than',
  LessThan = 'less_than',
  GreaterThanEqual = 'greater_than_equal',
  LessThanEqual = 'less_than_equal',
  Equal = 'equal',
  NotEqual = 'not_equal',
  NotContains = 'not_contains',
  NotStartsWith = 'not_starts_with',
  NotEndsWith = 'not_ends_with',
  IsNull = 'is_null',
  NotIsNull = 'not_is_null',
  IsEmpty = 'is_empty',
  NotIsEmpty = 'not_is_empty',
}

export interface IRemoteCellStyle {
  alignText?: 'left' | 'center' | 'right'
  backgroundColor?: string
  borderBottomColor?: string
  borderLeftColor?: string
  borderRightColor?: string
  borderStyle?: 'none' | 'solid'
  borderTopColor?: string
  borderWidth?: '1px'
  color?: string
  fontStyle?: 'normal' | 'italic'
  fontWeight?: 'normal' | 'bold'
}

export interface IRemoteCellCondition {
  comparator: Comparator
  thresholdValue: string | number | boolean | null
}

export interface IRemoteStyleCondition extends IRemoteCellCondition {
  cellStyle: IRemoteCellStyle
}

export interface IRemoteFormatCondition extends IRemoteCellCondition {
  format: DisplayFormat
}

export interface IRemoteTableColumnContext extends Record<string, unknown> {
  customerTableId?: string | null // TODO: Place at the right place.
  formatConditions?: IRemoteFormatCondition[]
  isCustomer?: boolean // TODO: Place at the right place. This decides if we should add link to the journey.
  order?: number // TODO: Place at the right place. This is used for ordering column.
  styleConditions?: IRemoteStyleCondition[]
}

export interface IRemoteTableContext {
  appliedFilters: any[] | null
  currency: string | null
  dataScanned: number | null
  datasetId: string | null
  isAll: boolean
  isCache: boolean
  locale: string | null
  name: string | null
  tableId: string | null
  tabSlug: string | null
  timezone: string | null
}

export interface IRemoteDataTableColumn {
  autoHeight?: boolean
  children?: IRemoteDataTableColumn[]
  context?: IRemoteTableColumnContext
  field: string
  flex?: number
  headerName?: string
  pinned?: 'left' | 'right' | boolean | null
  type?: DisplayFormat
  width?: number
  wrapText?: boolean
}

export interface IRemoteDataTable {
  columns: IRemoteDataTableColumn[]
  context?: IRemoteTableContext
  lastModifiedAt: string
  retrievedAt: string
  rows: Record<string, unknown>[]
}
