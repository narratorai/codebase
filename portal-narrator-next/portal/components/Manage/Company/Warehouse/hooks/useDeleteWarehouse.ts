import { useMutation } from '@tanstack/react-query'
import { App } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useOnboardingContext } from 'components/Onboarding/OnboardingProvider'
import { useWarehouse } from 'portal/stores/settings'
import analytics from 'util/analytics'
import { useShallow } from 'zustand/react/shallow'

interface IDeleteWarehouse {
  isAdmin: boolean
}

interface IHookReturn {
  deletingWarehouse: boolean
  deleteWarehouseError: Error | null
  deleteWarehouse: (value: IDeleteWarehouse) => Promise<void>
}

const useDeleteWarehouse = (onDelete?: () => void): IHookReturn => {
  const company = useCompany()
  const { isCompanyAdmin } = useUser()
  const { notification } = App.useApp()

  const { refetchOnboardingData } = useOnboardingContext()

  const [adminWarehouse, nonAdminWarehouse, storeDeleteWarehouse] = useWarehouse(
    useShallow((state) => [state.adminWarehouse, state.nonAdminWarehouse, state.deleteWarehouse])
  )

  const mutationFn = async ({ isAdmin }: IDeleteWarehouse) => {
    if (!isCompanyAdmin) return
    const warehouse = isAdmin ? adminWarehouse : nonAdminWarehouse
    if (warehouse === null) return

    await storeDeleteWarehouse(isAdmin, company.datacenter_region)

    analytics.track('deleted_warehouse_connection', {
      name: warehouse?.name,
      warehouse_type: warehouse?.type,
    })

    notification.success({ message: `Warehouse connection "${warehouse.name}" deleted` })

    // we need to refetch onboarding data once a warehouse
    // is deleted, so we show the proper onboarding steps
    refetchOnboardingData()

    onDelete?.()
  }

  const {
    isPending: deletingWarehouse,
    error: deleteWarehouseError,
    mutateAsync: deleteWarehouse,
  } = useMutation({ mutationFn })

  return {
    deletingWarehouse,
    deleteWarehouseError,
    deleteWarehouse,
  }
}

export default useDeleteWarehouse
