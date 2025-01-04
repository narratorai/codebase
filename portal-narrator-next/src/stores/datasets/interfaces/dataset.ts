import {
  CohortTimeKind,
  IRemoteAppendActivity,
  IRemoteCohortActivity,
  IRemoteDimension,
  IRemoteOrder,
  IRemoteParentColumn,
  IRemoteTab,
  IRemoteTabUI,
  IRemoteTimeCondition,
  TimeResolution,
} from '.'

export enum DatasetKind {
  Activity = 'activity',
  SQL = 'sql',
  Time = 'time',
  Table = 'table',
}

export interface IRemoteCohortTime {
  dims: IRemoteDimension[]
  fromCondition: IRemoteTimeCondition
  kind: CohortTimeKind
  resolution: TimeResolution
}

export interface IRemoteTable {
  id: string
  schemaName: string
  tableName: string
}

export interface IRemoteDatasetConfig {
  appendActivities: IRemoteAppendActivity[]
  cohortActivity: IRemoteCohortActivity | null
  cohortTime: IRemoteCohortTime | null
  kind: DatasetKind
  sqlQuery: string
  table: IRemoteTable | null
  tableId: string | null
}

export interface IRemoteDataset extends IRemoteDatasetConfig {
  allTabs: IRemoteTab[]
  columns: IRemoteParentColumn[]
  createdAt: string
  description?: string
  id: string
  name: string
  order: IRemoteOrder[]
  tabUi: IRemoteTabUI
  version: number
  versionId: string
}

// TODO: To be shared among multiple stores, it needs proper naming and placement.
export interface IRemoteGenericModel {
  createdAt: string
  createdBy: string | null
  favorited: boolean
  id: string
  sharedWithEveryone: boolean
  tagIds: string[]
  teamIds: string[]
  totalFavorites: number
}

// TODO: To be shared among multiple stores, it needs proper naming and placement.
export interface IRemoteNamedGenericModel extends IRemoteGenericModel {
  name: string
}

// TODO: To be shared among multiple stores, it needs proper naming and placement.
export interface IRemoteViewStats extends IRemoteNamedGenericModel {
  lastViewedAt: string | null
  lastViewedByAnyoneAt: string | null
  totalUserViews: number
}

// TODO: Is IRemoteCollection{Model} suitable for becoming part of our naming convention?
export interface IRemoteCollectionDataset extends IRemoteViewStats {
  activities: string[]
  dependents: string[]
  description: string | null
  integrationTypes: string[]
  locked: boolean
  tableId: string | null
}

export interface IRemoteDatasets {
  data: IRemoteCollectionDataset[]
  page: number
  perPage: number
  totalCount: number
}
