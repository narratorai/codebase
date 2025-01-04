import { DefaultError, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { useCompany } from '@/stores/companies'
import { DatasetsRepository, IRemoteOutputConfig } from '@/stores/datasets'
import { useNotificationsUI } from '@/stores/notifications'

interface IVariables {
  data: { name: string } & Pick<IRemoteOutputConfig, 'appliedFilters'>
  datasetId: string
  plotSlug: string
  tabSlug: string
}

interface IData {
  id: string
}

const repository = new DatasetsRepository()

const useCopyDataset = () => {
  const [datacenterRegion, companySlug] = useCompany((state) => [state.datacenterRegion, state.slug])
  const submitNotification = useNotificationsUI((state) => state.submit)
  const router = useRouter()

  const mutationFn = (variables: IVariables) => {
    const { datasetId, data } = variables
    return repository.duplicate(datasetId, data, datacenterRegion)
  }

  const onSuccess = (data: IData, variables: IVariables) => {
    const { tabSlug, plotSlug } = variables
    const { id } = data
    router.push(`/v2/${companySlug}/datasets/d/${id}?group=${tabSlug}&plot=${plotSlug}`)
  }

  const onError = (error: DefaultError) => {
    submitNotification({ label: error.message, status: 'error' })
  }

  const state = useMutation<IData, DefaultError, IVariables>({
    mutationFn,
    onSuccess,
    onError,
  })

  return state
}

export default useCopyDataset
