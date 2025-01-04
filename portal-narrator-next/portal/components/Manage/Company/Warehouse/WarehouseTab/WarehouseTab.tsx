import { Flex } from 'components/shared/jawns'
import { WarehouseTypes } from 'portal/stores/settings'
import React from 'react'

import WarehouseIcon from '../WarehouseIcon'

interface Props {
  warehouseType: WarehouseTypes
  warehouseName: string
}

const WarehousePanelHeader = ({ warehouseType, warehouseName }: Props) => (
  <Flex alignItems="center" p={12}>
    <WarehouseIcon warehouseType={warehouseType} small />
    {warehouseName}
  </Flex>
)

export default WarehousePanelHeader
