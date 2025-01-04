import { Card } from 'antd-next'
import { CardProps } from 'antd-next/es/card'
import { WarehouseTypes } from 'portal/stores/settings'
import React from 'react'

import WarehouseIcon from '../WarehouseIcon'

const { Meta } = Card
export const CARD_SIZE = 140

interface Props extends CardProps {
  warehouseType: WarehouseTypes
  warehouseName: string
  onClick: () => void
}

const WarehouseCard = ({ warehouseName, warehouseType, onClick, ...props }: Props) => (
  <Card
    {...props}
    hoverable
    style={{
      width: CARD_SIZE,
      marginRight: 8,
      marginBottom: 8,
    }}
    bodyStyle={{
      textAlign: 'center',
    }}
    cover={<WarehouseIcon warehouseType={warehouseType} height={CARD_SIZE} width={CARD_SIZE} />}
    onClick={onClick}
    data-test="warehouse-card"
  >
    <Meta title={warehouseName} />
  </Card>
)

export default WarehouseCard
