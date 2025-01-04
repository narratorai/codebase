import { useEffect } from 'react'
import _ from 'lodash'

import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { ApolloError, NetworkStatus } from '@apollo/client'
import { useListDatasetsQuery, useListDatasetsNeedsUpdateSubscription } from 'graph/generated'
import { DatasetsFromQuery } from 'components/Datasets/interfaces'
import { DEFAULT_ALLOWED_STATUSES } from 'components/Datasets/DatasetIndex'
import usePrevious from 'util/usePrevious'

interface IUseGetDatasets {
  loading: boolean
  error?: ApolloError
  datasets?: DatasetsFromQuery
  refetch: () => void
}

// Fetches datasets - used by narrative content (i.e. Basic Content dataset dropdowns)
// refetches datasets when the count changes
export default function useGetDatasets(): IUseGetDatasets {
  const company = useCompany()
  const { user } = useUser()

  // Get datasets
  const {
    data: datasets,
    loading: datasetsLoading,
    error: datasetsError,
    refetch: refetchDatasets,
    networkStatus: datasetsNetworkStatus,
  } = useListDatasetsQuery({
    variables: { company_id: company?.id, statuses: DEFAULT_ALLOWED_STATUSES, user_id: user?.id },
    notifyOnNetworkStatusChange: true,
    // This makes sure data reloads every time
    // the page loads (solves create/delete inconsistencies)
    fetchPolicy: 'cache-and-network',
  })
  const refetchingDatasets = datasetsNetworkStatus === NetworkStatus.refetch

  // Listen to Datasets count
  // - if a dataset is added - refetch datasets
  const { data: datasetIdsData } = useListDatasetsNeedsUpdateSubscription({
    variables: { company_id: company?.id },
  })
  const datasetIds = datasetIdsData?.dataset
  const prevDatasetIds = usePrevious(datasetIds)

  useEffect(() => {
    // dataset count has changed
    if (_.isFinite(prevDatasetIds?.length) && !_.isEqual(prevDatasetIds?.length, datasetIds?.length)) {
      // refetch the datasets!
      refetchDatasets()
    }
  }, [prevDatasetIds?.length, datasetIds?.length, refetchDatasets])

  return {
    datasets: datasets?.dataset,
    loading: datasetsLoading || refetchingDatasets,
    error: datasetsError,
    refetch: refetchDatasets,
  }
}
