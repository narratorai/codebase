import { IActivityIndexV2Query, IListDimTablesSubscription } from 'graph/generated'

export type Activities = IActivityIndexV2Query['all_activities']
export type Activity = Activities[number]

export type DimTables = IListDimTablesSubscription['dim_table']
