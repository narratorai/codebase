import type { DatacenterRegion } from '@/util/mavisClient'

export interface IRemoteCustomerDim {
  id: string
  schemaName: string | null
  table: string
}

export interface IRemoteTable {
  activityStream: string
  color: string
  customerDim: IRemoteCustomerDim | null
  customerDimTableId: string | null
  defaultTimeBetween: string | null
  id: string
  identifier: string
  isImported: boolean | null
  maintainerId: string | null
  manuallyPartitionActivity: boolean | null
  rowCount: number | null
  schemaName: string | null
  teamIds: string[] | null
  updatedAt: string
}

export interface IRemoteTables {
  data: IRemoteTable[]
  page: number
  perPage: number
  totalCount: number
}

export interface ITables extends IRemoteTables {
  table: IRemoteTable | null

  /** Set attributes on the model */
  set: (attributes: Partial<Pick<ITables, 'totalCount' | 'page' | 'perPage' | 'data' | 'table'>>) => void

  /** Reset the state */
  reset: () => void

  /** Get the data from the server */
  getTables: (datacenterRegion?: DatacenterRegion | null) => Promise<IRemoteTable[] | null>

  /** Set default table */
  setTable: (tableId: string) => void

  /** Retrieve a table from the collection given the table ID */
  getTable: (tableId: string) => IRemoteTable | null
}
