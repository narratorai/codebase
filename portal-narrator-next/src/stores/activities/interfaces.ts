import { DatacenterRegion } from '@/util/mavisClient'

export interface IRemoteActivitiesParams {
  tableId?: string
  tagIds?: string[]
  favorited?: boolean
  created_at?: {
    gte?: string
    lte?: string
  }
  teamIds?: string[]
  search?: string
  page?: number
  perPage?: number
}

export interface ITeamPermission {
  id: string
  canEdit: boolean
}

export interface IRemoteColumn {
  id: string
  name: string
  label: string
  type: string
  dimId: string | null
}

export interface IRemoteMaintenanceAlert {
  id: string
  kind: string
  notes: string | null
  startedAt: string
}

export interface IRemoteBaseActivity {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface IRemoteActivity extends IRemoteBaseActivity {
  rowCount: number
  tagIds: string[]
  columns: IRemoteColumn[]
  tableId: string
  alerts: IRemoteMaintenanceAlert[]
  createdAt: string
  updatedAt: string
  favorited: boolean
  teams: ITeamPermission[]
}

export interface IRemoteActivities {
  totalCount: number
  page: number
  perPage: number
  data: IRemoteActivity[]
}

export interface IActivities extends IRemoteActivities {
  params: IRemoteActivitiesParams | null

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteActivities> | Partial<Pick<IActivities, 'params'>>) => void

  /** Reset the state */
  reset: () => void

  /** Search activities on the server */
  searchActivities: (
    params?: IRemoteActivitiesParams,
    datacenterRegion?: DatacenterRegion
  ) => Promise<IRemoteActivities>

  /** Fetch the next set of activities from the server */
  getNextPage: (datacenterRegion?: DatacenterRegion) => Promise<IRemoteActivities | null>
}
