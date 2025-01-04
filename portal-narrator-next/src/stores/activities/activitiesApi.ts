import { DatacenterRegion, getMavis, SearchParams } from '@/util/mavisClient'

import { IRemoteActivities, IRemoteActivitiesParams } from './interfaces'

export const getActivities = async (
  params?: IRemoteActivitiesParams,
  datacenterRegion?: DatacenterRegion | null
): Promise<IRemoteActivities> => {
  const castParams = params as SearchParams
  return getMavis<IRemoteActivities>('/api/activities', { params: castParams, datacenterRegion })
}
