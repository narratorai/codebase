import { isEmpty } from 'lodash'
import { useWarehouse } from 'portal/stores/settings'

import { useDeleteWarehouse, useGetWarehouses, useSaveWarehouse } from '../hooks'
import WarehouseForm from './WarehouseForm'

interface Props {
  isAdmin: boolean
  onSubmit: () => void
  onDelete: () => void
}

const WarehouseFormContainer = ({ isAdmin, onSubmit, onDelete }: Props) => {
  const setWarehouses = useWarehouse((state) => state.setWarehouses)
  const { gettingWarehouses, adminWarehouse, nonAdminWarehouse } = useGetWarehouses()
  const { deletingWarehouse } = useDeleteWarehouse()
  const { savingWarehouse, saveWarehouse } = useSaveWarehouse(onSubmit)
  const warehouse = isAdmin ? adminWarehouse : nonAdminWarehouse

  if (warehouse === null) return null

  const loading = gettingWarehouses || deletingWarehouse || savingWarehouse
  const isEditing = !isEmpty(warehouse.options)

  const handleSubmit = async (form: any) => {
    const options = form.formData
    const updateWarehouse = {
      ...warehouse,
      options,
      isEditing,
    }
    await saveWarehouse(updateWarehouse)
  }

  const handleCancel = () => setWarehouses(null)

  return (
    <WarehouseForm
      warehouseType={warehouse.type}
      schema={warehouse.config.schema}
      ui_schema={warehouse.config.uischema}
      formData={warehouse.options}
      isEditing={isEditing}
      loading={loading}
      onSubmit={handleSubmit}
      onDelete={onDelete}
      onCancel={handleCancel}
    />
  )
}

export default WarehouseFormContainer
