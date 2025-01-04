import {
  ACTION_TYPE_COUNT,
  ACTION_TYPE_METRICS,
  ACTION_TYPE_QUERY,
} from 'components/Datasets/BuildDataset/datasetReducer'
import { ICompany } from 'graph/generated'
import _ from 'lodash'
import { IDatasetQueryDefinition, IRequestApiData, ITabApiData } from 'util/datasets/interfaces'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

interface ITokenAndCompany {
  getToken: GetToken
  company: ICompany
}

export interface DatasetNarrativeBodyProps {
  feature_id: string
  feature_label?: string
  kpi_id: string
  kpi_label?: string
  kpi_format: string
  impact_direction: string
  time_resolution: string
  row_name: string
  time_option_id?: string | null
  dataset: IDatasetQueryDefinition
}

export interface DatasetNarrativeProps extends ITokenAndCompany {
  body: DatasetNarrativeBodyProps
}

export const debugDatasetNarrative = async ({ getToken, company, body }: DatasetNarrativeProps) => {
  const response = await mavisRequest({
    method: 'POST',
    path: `/v1/narrative/template/debug_dataset_narrative`,
    params: {
      company: company.slug,
    },
    getToken,
    body: JSON.stringify(body),
    company,
  })

  return response
}

export const createDatasetNarrative = async ({ getToken, company, body }: DatasetNarrativeProps) => {
  const response = await mavisRequest({
    method: 'POST',
    path: `/v1/narrative/template/create_dataset_narrative`,
    params: {
      company: company.slug,
    },
    getToken,
    body: JSON.stringify(body),
    company,
  })

  return response
}

export interface DatasetKpiBodyProps {
  kpi_id: string
  kpi_label?: string
  kpi_format: string
  impact_direction: string
  time_resolution: string
  row_name: string
  time_option_id?: string | null
  dataset: IDatasetQueryDefinition
}

export interface DatasetKpiProps extends ITokenAndCompany {
  body: DatasetKpiBodyProps
}

export interface DatasetKpiResponse {
  markdown: string
  metric_id: string
}

interface GetQueryDefinitionProps extends ITokenAndCompany {
  datasetSlug: string
  // upload_key and narrative_slug are used when directed to the dataset
  // from a plot in an assebmled narrative/dashboard
  upload_key?: string
  narrative_slug?: string
}

export const getQueryDefinition = async ({
  getToken,
  company,
  datasetSlug,
  upload_key,
  narrative_slug,
}: GetQueryDefinitionProps): Promise<IDatasetQueryDefinition> => {
  const response: IDatasetQueryDefinition = await mavisRequest({
    path: '/v1/dataset/get_config',
    params: {
      company: company.slug,
      slug: datasetSlug,
      upload_key,
      narrative_slug,
    },
    getToken,
    company,
  })

  return response
}

export const getAllColumnShortcuts = async ({ getToken, company }: ITokenAndCompany) => {
  const response = await mavisRequest({
    path: '/v1/dataset/create/all_shortcuts',
    params: {
      company: company.slug,
    },
    getToken,
    company,
  })

  return response
}

interface FetchDatasetSqlProps extends ITokenAndCompany {
  groupSlug?: string | null
  queryDefinition: IDatasetQueryDefinition
}

export const fetchDatasetSql = async ({ getToken, company, groupSlug, queryDefinition }: FetchDatasetSqlProps) => {
  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/translate',
    params: {
      company: company.slug,
      group_slug: groupSlug,
    },
    getToken,
    body: JSON.stringify({
      dataset: queryDefinition,
    }),
    company,
  })

  return response
}

interface EmailLargeDatasetCsvProps extends ITokenAndCompany {
  groupSlug?: string | null
  companyUserId: string
  queryDefinition: IDatasetQueryDefinition
}

export const emailLargeDatasetCsv = async ({
  getToken,
  company,
  groupSlug,
  companyUserId,
  queryDefinition,
}: EmailLargeDatasetCsvProps) => {
  const body = JSON.stringify({
    dataset: queryDefinition,
  })

  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/trigger_download',
    params: {
      company: company.slug,
      group_slug: groupSlug,
      company_user_id: companyUserId,
    },
    getToken,
    body,
    company,
  })

  return response
}

interface FetchRunDatasetProps extends ITokenAndCompany {
  datasetSlug?: string
  groupSlug?: string | null
  queryDefinition: IDatasetQueryDefinition
  signal?: AbortSignal
  runLive?: boolean
  asCsv?: boolean
  cancel?: boolean
}

export const fetchRunDataset = async ({
  getToken,
  company,
  datasetSlug,
  groupSlug,
  queryDefinition,
  signal,
  runLive = false,
  asCsv = false,
  cancel = false,
}: FetchRunDatasetProps) => {
  const body = datasetSlug
    ? // if we send over dataset_slug MAVIS is smart enough to fetch the saved query definition from S3
      undefined
    : // otherwise, POST over the query definition so MAVIS knows to run that
      JSON.stringify({
        dataset: queryDefinition,
      })

  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/run',
    params: {
      company: company.slug,
      group_slug: groupSlug,
      as_csv: asCsv,
      cancel: cancel,
      run_live: runLive,
      // if we send over dataset_slug MAVIS is smart enough to fetch the saved query definition from S3
      dataset_slug: datasetSlug,
    },
    getToken,
    body,
    textResponse: asCsv,
    retryable: true,
    opts: {
      // Make requests abortable
      // https://developer.mozilla.org/en-US/docs/Web/API/AbortController
      // https://stackoverflow.com/questions/31061838/how-do-i-cancel-an-http-fetch-request
      signal,
    },
    company,
  })

  return response
}

interface FetchRunDatasetCountProps extends ITokenAndCompany {
  datasetSlug?: string
  groupSlug?: string | null
  queryDefinition: IDatasetQueryDefinition
  signal?: AbortSignal
  cancel?: boolean
  runLive?: boolean
}

export const fetchRunDatasetCount = async ({
  getToken,
  company,
  groupSlug,
  queryDefinition,
  signal,
  cancel = false,
  runLive = false,
}: FetchRunDatasetCountProps) => {
  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/count',
    params: {
      company: company.slug,
      group_slug: groupSlug,
      cancel,
      run_live: runLive,
    },
    getToken,
    body: JSON.stringify({
      dataset: queryDefinition,
    }),
    retryable: true,
    opts: {
      signal,
    },
    company,
  })

  return response
}

interface FetchRunDatasetMetricsProps extends ITokenAndCompany {
  groupSlug?: string | null
  queryDefinition: IDatasetQueryDefinition
  signal?: AbortSignal
  cancel?: boolean
}

export const fetchRunDatasetMetrics = async ({
  getToken,
  company,
  groupSlug,
  queryDefinition,
  signal,
  cancel = false,
}: FetchRunDatasetMetricsProps) => {
  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/metrics',
    params: {
      company: company.slug,
      group_slug: groupSlug,
      cancel,
    },
    getToken,
    body: JSON.stringify({
      dataset: queryDefinition,
    }),
    opts: {
      signal,
    },
    company,
  })

  return response
}

interface CancelAllDatasetApiRequestsProps extends ITokenAndCompany {
  groupSlug?: string | null
  selectedApiData: ITabApiData
  runningAllTabs?: boolean
}

// Cancel lingering api reqs made to MAVIS when navigating away from dataset
export const cancelAllDatasetApiRequests = ({
  getToken,
  company,
  groupSlug,
  selectedApiData,
  runningAllTabs,
}: CancelAllDatasetApiRequestsProps) => {
  const datasetQuery = _.get(selectedApiData, ACTION_TYPE_QUERY, {}) as IRequestApiData
  const countQuery = _.get(selectedApiData, ACTION_TYPE_COUNT, {}) as IRequestApiData
  const metricQuery = _.get(selectedApiData, ACTION_TYPE_METRICS, {}) as IRequestApiData

  // if they hit 'run all tabs' make sure to cancel all requests
  if (runningAllTabs) {
    // cancel dataset requests
    if (!_.isEmpty(datasetQuery.queryDefinition)) {
      // cancel parent dataset
      fetchRunDataset({
        getToken,
        company,
        queryDefinition: datasetQuery.queryDefinition as IDatasetQueryDefinition,
        cancel: true,
      })

      // cancel all groups
      const groups = _.get(datasetQuery.queryDefinition, 'query.all_groups', [])
      _.forEach(groups, (group) => {
        fetchRunDataset({
          getToken,
          company,
          groupSlug: group.slug,
          queryDefinition: datasetQuery.queryDefinition as IDatasetQueryDefinition,
          cancel: true,
        })
      })
    }

    // cancel count requests
    if (!_.isEmpty(countQuery.queryDefinition)) {
      // cancel parent count
      fetchRunDatasetCount({
        getToken,
        company,
        queryDefinition: countQuery.queryDefinition as IDatasetQueryDefinition,
        cancel: true,
      })

      // cancel all group counts
      const groups = _.get(countQuery.queryDefinition, 'query.all_groups', [])
      _.forEach(groups, (group) => {
        fetchRunDatasetCount({
          getToken,
          company,
          groupSlug: group.slug,
          queryDefinition: countQuery.queryDefinition as IDatasetQueryDefinition,
          cancel: true,
        })
      })
    }

    // cancel metric requests
    if (!_.isEmpty(metricQuery.queryDefinition)) {
      // cancel parent metrics
      fetchRunDatasetMetrics({
        getToken,
        company,
        queryDefinition: metricQuery.queryDefinition as IDatasetQueryDefinition,
        cancel: true,
      })

      // cancel all group metrics
      const groups = _.get(metricQuery.queryDefinition, 'query.all_groups', [])
      _.forEach(groups, (group) => {
        fetchRunDatasetMetrics({
          getToken,
          company,
          groupSlug: group.slug,
          queryDefinition: metricQuery.queryDefinition as IDatasetQueryDefinition,
          cancel: true,
        })
      })
    }

    return
  }

  // Otherwise they just ran dataset and metrics on a single tab, so just cancel that tab
  // cancel the dataset query
  if (!_.isEmpty(datasetQuery.queryDefinition) && datasetQuery.loading) {
    fetchRunDataset({
      getToken,
      company,
      groupSlug,
      queryDefinition: datasetQuery.queryDefinition as IDatasetQueryDefinition,
      cancel: true,
    })
  }

  // cancel the COUNT query
  if (!_.isEmpty(countQuery.queryDefinition) && countQuery.loading) {
    fetchRunDatasetCount({
      getToken,
      company,
      groupSlug,
      queryDefinition: countQuery.queryDefinition as IDatasetQueryDefinition,
      cancel: true,
    })
  }

  // cancel the metric query
  if (!_.isEmpty(metricQuery.queryDefinition) && metricQuery.loading) {
    fetchRunDatasetMetrics({
      getToken,
      company,
      groupSlug,
      queryDefinition: metricQuery.queryDefinition as IDatasetQueryDefinition,
      cancel: true,
    })
  }

  return
}

interface DuplicateDatasetProps extends ITokenAndCompany {
  id: string
  name: string
}

export const duplicateDataset = async ({ getToken, company, id, name }: DuplicateDatasetProps) => {
  const body = { name }

  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/duplicate',
    params: {
      company: company.slug,
      dataset_id: id,
    },
    getToken,
    body: JSON.stringify(body),
    company,
  })

  return response
}

interface UpdateDatasetProps extends ITokenAndCompany {
  dataset?: IDatasetQueryDefinition
  name: string
  id?: string
  slug?: string
  description?: string | null
  status: string
  materializations?: any
  created_by?: string
  hide_from_index?: boolean
  tags?: string[]
  locked?: boolean | null
  asQuickSave?: boolean
}

export const updateDataset = async ({
  getToken,
  company,
  dataset,
  name,
  id,
  slug,
  description,
  status,
  materializations,
  created_by,
  hide_from_index,
  tags,
  locked,
  asQuickSave = true,
}: UpdateDatasetProps) => {
  const body = {
    dataset,
    name,
    slug,
    id,
    description,
    status,
    materializations,
    created_by,
    // datasets that haven't been backfilled are null
    // force them to be boolean
    hide_from_index: !!hide_from_index,
    tags,
    locked,
    as_quick_save: asQuickSave,
  }

  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/dataset/update',
    params: {
      company: company.slug,
    },
    getToken,
    body: JSON.stringify(body),
    company,
  })

  return response
}

interface DeleteDatasetProps extends ITokenAndCompany {
  id: string
}

export const deleteDataset = async ({ getToken, company, id }: DeleteDatasetProps) => {
  const response = await mavisRequest({
    method: 'DELETE',
    path: `/v1/dataset/${id}`,
    params: {
      company: company.slug,
    },
    getToken,
    company,
  })

  return response
}

interface ListNarrativeTemplateColumnOptionsProps extends ITokenAndCompany {
  body: {
    dataset: IDatasetQueryDefinition
  }
}

export const listNarrativeTemplateColumnOptions = async ({
  getToken,
  company,
  body,
}: ListNarrativeTemplateColumnOptionsProps) => {
  const response = await mavisRequest({
    method: 'POST',
    path: `/v1/narrative/template/get_column_options`,
    params: {
      company: company.slug,
    },
    getToken,
    body: JSON.stringify(body),
    retryable: true,
    company,
  })

  return response
}
