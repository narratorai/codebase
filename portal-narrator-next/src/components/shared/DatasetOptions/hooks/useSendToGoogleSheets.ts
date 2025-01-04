import { DefaultError, useMutation } from '@tanstack/react-query'

import { useCompany } from '@/stores/companies'
import { DatasetsRepository, IRemoteDatasetOptionsReturnMessage } from '@/stores/datasets'
import { useNotificationsUI } from '@/stores/notifications'

interface IVariables {
  datasetId: string
  sheetKey: string
  tabSlug: string
}

const repository = new DatasetsRepository()

const useSendToGoogleSheets = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const submitNotification = useNotificationsUI((state) => state.submit)

  const mutationFn = (variables: IVariables) => {
    const { datasetId, tabSlug, sheetKey } = variables
    return repository.sendToGoogleSheets(datasetId, tabSlug, sheetKey, datacenterRegion)
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

export default useSendToGoogleSheets
