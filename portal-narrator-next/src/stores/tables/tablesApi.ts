import { DatacenterRegion, getMavis, SearchParams } from '@/util/mavisClient'

import { IRemoteTables } from './interfaces'

export const getTables = async (params?: SearchParams, datacenterRegion?: DatacenterRegion): Promise<IRemoteTables> => {
  return getMavis<IRemoteTables>('/api/tables', { params, datacenterRegion })
}
