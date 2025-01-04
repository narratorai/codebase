import { DefaultError, useMutation } from '@tanstack/react-query'

import { useCompany } from '@/stores/companies'
import { DatasetsRepository, IRemoteOutputConfig } from '@/stores/datasets'
import { useNotificationsUI } from '@/stores/notifications'

interface IVariables {
  data: Pick<IRemoteOutputConfig, 'appliedFilters'>
  datasetId: string
  format: 'csv' | 'xls'
  tabSlug: string
}

const repository = new DatasetsRepository()

const useDownload = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const submitNotification = useNotificationsUI((state) => state.submit)

  const mutationFn = (variables: IVariables) => {
    const { datasetId, tabSlug, format, data } = variables
    return repository.download(datasetId, tabSlug, format, data, datacenterRegion)
  }

  const onSuccess = (data: Blob, variables: IVariables) => {
    const { format } = variables
    const url = URL.createObjectURL(data)
    const timestamp = new Date().toISOString().replace(/[-:Z]/g, '')
    const fileName = `download_${timestamp}.${format}`
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onError = (error: DefaultError) => {
    submitNotification({ label: error.message, status: 'error' })
  }

  const state = useMutation<Blob, DefaultError, IVariables>({
    mutationFn,
    onSuccess,
    onError,
  })

  return state
}

export default useDownload
