import { useQuery } from '@tanstack/react-query'
import { useCompany } from 'components/context/company/hooks'
import { useAdminOnboarding } from 'portal/stores/settings'
import { IMapping } from 'portal/stores/settings'
import { useShallow } from 'zustand/react/shallow'

interface IHookReturn {
  dataSources: string[]
  schemas: string[]
  mappings: IMapping[]
  gettingMappings: boolean
  getMappingsError: Error | null
  getMappings: () => Promise<any>
}

const useGetMappings = (): IHookReturn => {
  const company = useCompany()

  const [fetch, dataSources, schemas, mappings] = useAdminOnboarding(
    useShallow((state) => [state.fetch, state.data_sources, state.schemas, state.mappings])
  )

  const {
    isFetching: gettingMappings,
    error: getMappingsError,
    refetch: getMappings,
  } = useQuery({
    queryKey: ['onboarding-mappings', company.datacenter_region],
    queryFn: () => fetch(company.datacenter_region),
    enabled: false,
  })

  return {
    dataSources,
    schemas,
    mappings,
    gettingMappings,
    getMappingsError,
    getMappings,
  }
}

export default useGetMappings
