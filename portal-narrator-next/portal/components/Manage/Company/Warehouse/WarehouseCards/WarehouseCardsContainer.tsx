import { WarehouseTypes } from 'portal/stores/settings'
import { useState } from 'react'

import { useGetWarehouseOptions, useGetWarehouses } from '../hooks'
import WarehouseCards from './WarehouseCards'

const WarehouseCardsContainer = () => {
  const [warehouseType, setWarehouseType] = useState<WarehouseTypes | undefined>()
  const { gettingWarehouses, adminWarehouse, nonAdminWarehouse } = useGetWarehouses(warehouseType, true)
  const { options } = useGetWarehouseOptions()

  const hideWarehouseCards = adminWarehouse !== null || nonAdminWarehouse !== null

  if (gettingWarehouses || hideWarehouseCards) return null

  return <WarehouseCards options={options} onSelect={setWarehouseType} />
}

export default WarehouseCardsContainer
