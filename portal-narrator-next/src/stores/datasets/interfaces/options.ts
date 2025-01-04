import { ColumnType } from '.'

export interface IRemoteOutputConfig {
  appliedFilters?: any[]
  datasetId: string
  datasetName: string
  groupName?: string
  isAll: boolean
  plotSlug: string
  question?: string
  snapshotTime?: string
  tabSlug: string
  versionId?: string
  xType?: ColumnType
}

export interface IRemoteDatasetOptionsReturnMessage {
  message: string
  scheduled: boolean
}
