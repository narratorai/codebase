import { useQuery } from '@tanstack/react-query'
import { useCompany } from 'components/context/company/hooks'
import { IWarehouseOption, useWarehouse } from 'portal/stores/settings'
import { useShallow } from 'zustand/react/shallow'

interface IHookReturn {
  options: IWarehouseOption[]
  gettingOptions: boolean
  getOptionsError: Error | null
}

const useGetWarehouseOptions = (): IHookReturn => {
  const company = useCompany()

  const [options, getOptions] = useWarehouse(useShallow((state) => [state.options, state.getOptions]))

  const { isFetching: gettingOptions, error: getOptionsError } = useQuery({
    queryKey: ['warehouse-options', company.datacenter_region],
    queryFn: () => getOptions(company.datacenter_region),
  })

  return {
    options,
    gettingOptions,
    getOptionsError,
  }
}

export default useGetWarehouseOptions
