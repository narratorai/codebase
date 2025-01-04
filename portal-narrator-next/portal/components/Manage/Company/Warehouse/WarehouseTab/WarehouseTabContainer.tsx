import { useGetWarehouses } from '../hooks'
import WarehouseTab from './WarehouseTab'

interface Props {
  isAdmin: boolean
}

const WarehouseTabContainer = ({ isAdmin }: Props) => {
  const { adminWarehouse, nonAdminWarehouse } = useGetWarehouses()
  const warehouse = isAdmin ? adminWarehouse : nonAdminWarehouse

  if (warehouse === null) return null

  return <WarehouseTab warehouseName={warehouse.name} warehouseType={warehouse.type} />
}

export default WarehouseTabContainer
