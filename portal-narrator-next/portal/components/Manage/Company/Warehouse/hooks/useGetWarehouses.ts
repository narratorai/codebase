import { useQuery } from '@tanstack/react-query'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { IWarehouse, useWarehouse, WarehouseTypes } from 'portal/stores/settings'
import { useShallow } from 'zustand/react/shallow'

interface IHookReturn {
  adminWarehouse: IWarehouse | null
  nonAdminWarehouse: IWarehouse | null
  gettingWarehouses: boolean
  getWarehousesError: Error | null
}

const useGetWarehouses = (warehouseType?: WarehouseTypes, enabled: boolean = false): IHookReturn => {
  const company = useCompany()
  const { isCompanyAdmin } = useUser()

  const [adminWarehouse, nonAdminWarehouse, getWarehouses] = useWarehouse(
    useShallow((state) => [state.adminWarehouse, state.nonAdminWarehouse, state.getWarehouses])
  )

  const queryFn = () => {
    if (!isCompanyAdmin) return false
    return getWarehouses(warehouseType, company.datacenter_region)
  }

  const { isFetching: gettingWarehouses, error: getWarehousesError } = useQuery({
    queryKey: [warehouseType, 'warehouses', company.datacenter_region],
    queryFn,
    enabled,
  })

  return {
    adminWarehouse,
    nonAdminWarehouse,
    gettingWarehouses,
    getWarehousesError,
  }
}

export default useGetWarehouses
