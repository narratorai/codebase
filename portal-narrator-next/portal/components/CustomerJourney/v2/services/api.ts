import { ICompany } from 'graph/generated'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

import { GET_CUSTOMER_JOURNEY_LIMIT } from './constants'

interface ITokenAndCompany {
  getToken: GetToken
  company: ICompany
}

export interface IGetCustomerJourney extends ITokenAndCompany {
  customer?: string
  customer_kind?: string
  table?: string
  activities?: string[]
  start_activity?: string | null
  only_first_occurrence: boolean
  timestamp?: string
  time_filter?: Record<string, any>
  limit?: number
  asc?: boolean
  offset?: number
  signal?: AbortSignal | null
  as_visual?: boolean
  runLive?: boolean
  depth?: number
  hide_activities?: boolean
  time_between?: number
  time_between_resolution?: string
}

export const getCustomerJourney = async ({
  getToken,
  customer,
  customer_kind,
  table,
  activities,
  start_activity,
  only_first_occurrence,
  timestamp,
  time_filter,
  asc = false,
  offset,
  signal = null,
  as_visual,
  runLive,
  depth,
  hide_activities,
  time_between,
  time_between_resolution,
  company,
}: IGetCustomerJourney) => {
  return await mavisRequest<any>({
    method: 'POST',
    path: `/v1/customer_journey/stream`,
    params: {
      company: company.slug,
      as_visual,
      run_live: runLive,
    },
    retryable: true,
    getToken,
    body: JSON.stringify({
      customer: customer?.toLowerCase(),
      customer_kind,
      activities,
      start_activity,
      only_first_occurrence,
      timestamp,
      time_filter,
      limit: GET_CUSTOMER_JOURNEY_LIMIT,
      table,
      asc,
      offset,
      depth,
      hide_activities,
      time_between,
      time_between_resolution,
    }),
    opts: {
      signal,
    },
    company,
  })
}

interface IGetAutoCompleteCustomer extends ITokenAndCompany {
  dimTable: string
  inputValue: string
  signal?: AbortSignal
}

export const getAutoCompleteCustomer = async ({
  dimTable,
  inputValue,
  getToken,
  signal,
  company,
}: IGetAutoCompleteCustomer) => {
  return await mavisRequest<any>({
    method: 'GET',
    path: '/v1/customer_journey/autocomplete',
    params: {
      company: company.slug,
      customer_part: inputValue,
      dim_table_id: dimTable,
    },
    retryable: true,
    getToken,
    opts: {
      // Make requests abortable
      // https://developer.mozilla.org/en-US/docs/Web/API/AbortController
      // https://stackoverflow.com/questions/31061838/how-do-i-cancel-an-http-fetch-request
      signal,
    },
    company,
  })
}

interface IGetCustomerProfile extends ITokenAndCompany {
  customer?: string
  table: string
  runLive?: boolean
}

export const getCustomerProfile = async ({ customer, runLive, table, getToken, company }: IGetCustomerProfile) => {
  return await mavisRequest<any>({
    method: 'GET',
    path: '/v1/customer_journey/attributes',
    params: {
      company: company.slug,
      customer,
      dim_table_id: table,
      run_live: runLive,
    },
    retryable: true,
    getToken,
    company,
  })
}

interface IGetCustomerJourneyFromDataset extends ITokenAndCompany {
  row: any
  dataset: IDatasetQueryDefinition
  offset?: number
  fullJourney?: boolean
}

export const getCustomerJourneyFromDataset = async ({
  getToken,
  offset,
  row,
  dataset,
  fullJourney = false,
  company,
}: IGetCustomerJourneyFromDataset) => {
  return await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/customer_journey',
    params: {
      company: company.slug,
      full_journey: fullJourney,
    },
    retryable: true,
    getToken,
    body: JSON.stringify({
      limit: GET_CUSTOMER_JOURNEY_LIMIT,
      row,
      dataset,
      offset,
    }),
    company,
  })
}
