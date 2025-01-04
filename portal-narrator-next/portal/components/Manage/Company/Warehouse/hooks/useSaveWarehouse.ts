import { useMutation } from '@tanstack/react-query'
import { App } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { IWarehouse, useWarehouse } from 'portal/stores/settings'
import analytics from 'util/analytics'

interface ISaveWarehouse extends IWarehouse {
  isEditing: boolean
}

interface IHookReturn {
  savingWarehouse: boolean
  saveWarehouseError: Error | null
  saveWarehouse: (value: ISaveWarehouse) => Promise<void>
}

const useSaveWarehouse = (onSave?: () => void): IHookReturn => {
  const company = useCompany()
  const { isCompanyAdmin } = useUser()
  const { notification } = App.useApp()

  const storeSaveWarehouse = useWarehouse((state) => state.saveWarehouse)

  const mutationFn = async (warehouse: ISaveWarehouse) => {
    if (!isCompanyAdmin) return
    if (warehouse === null) return

    const { isEditing } = warehouse

    const response = await storeSaveWarehouse(warehouse, company.datacenter_region)

    const isCreate = !isEditing

    const { success, name, type: warehouse_type, message, description } = response

    if (success) {
      analytics.track(isCreate ? 'created_warehouse_connection' : 'updated_warehouse_connection', {
        name,
        warehouse_type,
      })
    }
    if (message) {
      if (success) {
        notification.success({ message, description })
      } else {
        notification.error({ message, description, duration: null })
      }
    }

    if (success) onSave?.()
  }

  const {
    isPending: savingWarehouse,
    error: saveWarehouseError,
    mutateAsync: saveWarehouse,
  } = useMutation({ mutationFn })

  return {
    savingWarehouse,
    saveWarehouseError,
    saveWarehouse,
  }
}

export default useSaveWarehouse
