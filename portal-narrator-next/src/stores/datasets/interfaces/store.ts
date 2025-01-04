import { DatacenterRegion } from '@/util/mavisClient'

import { IRemoteDataset, IRemoteDatasets } from '.'

export enum MaterializationType {
  Cached = 'cached',
  ClearfindSoftwareMatch = 'clearfind_software_match',
  Csv = 'csv',
  Gsheets = 'gsheets',
  Klaviyo = 'klaviyo',
  MaterializedView = 'materialized_view',
  Postmark = 'postmark',
  Sendgrid = 'sendgrid',
  Text = 'text',
  View = 'view',
  Webhook = 'webhook',
}

export enum Grouping {
  RecentlyViewed = 'recently_viewed',
  RecentlyViewedByTeam = 'recently_viewed_by_team',
  TopViewedByTeam = 'top_viewed_by_team',
  TopFavoritedByTeam = 'top_favorited_by_team',
  ActivatedData = 'activated_data',
  ExportedData = 'exported_data',
}

export interface IRemoteRangeParam {
  gte?: string | null
  lte?: string | null
}

export type IRemoteDatasetsSearchParams = {
  page: number
  perPage: number
  search: string
}

export interface IDataset extends IRemoteDataset {
  get(id: string, datacenterRegion?: DatacenterRegion): Promise<IRemoteDataset>

  /** Reset the state */
  reset: () => void

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteDataset>) => void
}

export interface IDatasets extends IRemoteDatasets {
  getAll(params: IRemoteDatasetsSearchParams, datacenterRegion?: DatacenterRegion): Promise<IRemoteDatasets>

  params: IRemoteDatasetsSearchParams | null

  /** Reset the state */
  reset: () => void

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteDatasets> | Partial<Pick<IDatasets, 'params'>>) => void
}
