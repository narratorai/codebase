import { IRemoteBaseActivity } from '@/stores/activities'
import { DatacenterRegion } from '@/util/mavisClient'

export enum ActivityAction {
  Include = 'include',
  Exclude = 'exclude',
}
export interface IRemoteJourneyActivitiesParams {
  activityId?: string
  runLive?: boolean
  search?: string
  page?: number
  perPage?: number
}

export interface IRemoteJourneyAttributesParams {
  customer?: string
  runLive?: boolean
}

export interface IRemoteJourneyEventsParams {
  customer?: string
  useAnonymousId?: boolean
  limit?: number
  offset?: number
  desc?: boolean
  activityAction?: ActivityAction
  limitActivities?: string[]
  fromTime?: string
  toTime?: string
  runLive?: boolean
}

export interface IRemoteJourneyAttribute {
  name: string
  value: string | null
}

export interface IRemoteJourneyCustomer {
  customerDisplayName: string | null
  customer: string
}

export interface IRemoteJourneyActivity extends IRemoteJourneyCustomer {
  occurrence: string | null
  ts: string | null
}

export interface IRemoteJourneyActivities {
  totalCount: number
  page: number
  perPage: number
  data: IRemoteJourneyActivity[]
}

export interface IRemoteJourneyAttributes {
  attributes: IRemoteJourneyAttribute[]
  nullAttributes: string[]
}

export interface IRemoteJourneyEvent {
  id: string
  ts: string
  activity: string
  attributes: IRemoteJourneyAttribute[]
  occurrence: number
  revenue: number | null
  link: string | null
}

export interface IRemoteJourneyEvents {
  totalCount: number
  page: number
  perPage: number
  data: IRemoteJourneyEvent[]
}

export interface IRemoteJourneyConfig {
  customer: IRemoteJourneyCustomer
  customerOptions: IRemoteJourneyCustomer[]
  activityAction: ActivityAction
  activities: IRemoteBaseActivity[]
  fromTime: string | null
  toTime: string | null
}

export interface IJourneyEvents extends IRemoteJourneyEvents {
  params: IRemoteJourneyEventsParams | null

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteJourneyEvents> | Partial<Pick<IJourneyEvents, 'params'>>) => void

  /** Reset the state */
  reset: () => void

  /** Search journey events on the server */
  searchJourneyEvents: (
    tableId: string,
    params?: IRemoteJourneyEventsParams,
    datacenterRegion?: DatacenterRegion
  ) => Promise<IRemoteJourneyEvents>

  /** Fetch the next set of journey events from the server */
  getNextPage: (tableId: string, datacenterRegion?: DatacenterRegion) => Promise<IRemoteJourneyEvents | null>
}

export interface IJourneyActivities extends IRemoteJourneyActivities {
  params: IRemoteJourneyActivitiesParams | null

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteJourneyActivities> | Partial<Pick<IJourneyActivities, 'params'>>) => void

  /** Reset the state */
  reset: () => void

  /** Search journey activities on the server */
  searchJourneyActivities: (
    tableId: string,
    params?: IRemoteJourneyActivitiesParams,
    datacenterRegion?: DatacenterRegion
  ) => Promise<IRemoteJourneyActivities>

  /** Fetch the next set of journey activities from the server */
  getNextPage: (tableId: string, datacenterRegion?: DatacenterRegion) => Promise<IRemoteJourneyActivities | null>
}
