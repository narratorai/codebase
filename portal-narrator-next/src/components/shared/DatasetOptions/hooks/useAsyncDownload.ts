import { DefaultError, useMutation } from '@tanstack/react-query'

import { useCompany } from '@/stores/companies'
import { DatasetsRepository, IRemoteDatasetOptionsReturnMessage, IRemoteOutputConfig } from '@/stores/datasets'
import { useNotificationsUI } from '@/stores/notifications'

interface IVariables {
  data: Pick<IRemoteOutputConfig, 'appliedFilters'>
  datasetId: string
  format: 'csv' | 'xls'
  tabSlug: string
}

const repository = new DatasetsRepository()

const useAsyncDownload = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const submitNotification = useNotificationsUI((state) => state.submit)

  const mutationFn = (variables: IVariables) => {
    const { datasetId, tabSlug, format, data } = variables
    return repository.asyncDownload(datasetId, tabSlug, format, data, datacenterRegion)
  }

  const onSuccess = (data: IRemoteDatasetOptionsReturnMessage) => {
    const { scheduled, message } = data
    if (scheduled) {
      submitNotification({ label: message, status: 'success' })
    } else {
      submitNotification({ label: message, status: 'error' })
    }
  }

  const onError = (error: DefaultError) => {
    submitNotification({ label: error.message, status: 'error' })
  }

  const state = useMutation<IRemoteDatasetOptionsReturnMessage, DefaultError, IVariables>({
    mutationFn,
    onSuccess,
    onError,
  })

  return state
}

export default useAsyncDownload
