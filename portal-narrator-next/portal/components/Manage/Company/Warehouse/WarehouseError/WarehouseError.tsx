import { Alert } from 'antd-next'
import { Box } from 'components/shared/jawns'

import { useDeleteWarehouse, useGetWarehouses, useSaveWarehouse } from '../hooks'

const WarehouseError = () => {
  const { getWarehousesError } = useGetWarehouses()
  const { deleteWarehouseError } = useDeleteWarehouse()
  const { saveWarehouseError } = useSaveWarehouse()

  const error = getWarehousesError || deleteWarehouseError || saveWarehouseError

  if (!error) return null

  return (
    <Box mb={2}>
      <Alert message="Error" type="error" description={error.message} showIcon />
    </Box>
  )
}

export default WarehouseError
