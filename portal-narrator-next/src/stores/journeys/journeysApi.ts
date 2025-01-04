import { DatacenterRegion, getMavis, SearchParams } from '@/util/mavisClient'

import {
  IRemoteJourneyActivities,
  IRemoteJourneyActivitiesParams,
  IRemoteJourneyAttributes,
  IRemoteJourneyAttributesParams,
  IRemoteJourneyEvents,
  IRemoteJourneyEventsParams,
} from './interfaces'

export const getJourneyActivities = async (
  tableId: string,
  params?: IRemoteJourneyActivitiesParams,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteJourneyActivities> => {
  const castParams = params as SearchParams
  return getMavis<IRemoteJourneyActivities>(`/api/journeys/${tableId}`, { params: castParams, datacenterRegion })
}

export const getJourneyAttributes = async (
  tableId: string,
  params?: IRemoteJourneyAttributesParams,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteJourneyAttributes> => {
  const castParams = params as SearchParams
  return getMavis<IRemoteJourneyAttributes>(`/api/journeys/${tableId}/attributes`, {
    params: castParams,
    datacenterRegion,
  })
}

export const getJourneyEvents = async (
  tableId: string,
  params?: IRemoteJourneyEventsParams,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteJourneyEvents> => {
  const castParams = params as SearchParams
  return getMavis<IRemoteJourneyEvents>(`/api/journeys/${tableId}/events`, { params: castParams, datacenterRegion })
}
