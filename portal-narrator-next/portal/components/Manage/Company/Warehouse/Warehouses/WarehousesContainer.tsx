import { useGetWarehouses } from '../hooks'
import Warehouses from './Warehouses'

const WarehousesContainer = () => {
  const { adminWarehouse, nonAdminWarehouse } = useGetWarehouses()

  const items = []

  if (nonAdminWarehouse !== null) items.push({ key: '1', isAdmin: false })
  if (adminWarehouse !== null) items.push({ key: '2', isAdmin: true })

  return <Warehouses items={items} />
}

export default WarehousesContainer
