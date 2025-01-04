import { Tabs } from 'antd-next'

import WarehouseContent from '../WarehouseContent'
import WarehouseTab from '../WarehouseTab'

interface Props {
  items: { key: string; isAdmin: boolean }[]
}

const Warehouses = ({ items }: Props) => (
  <Tabs
    defaultActiveKey="1"
    type="card"
    items={items.map(({ key, isAdmin }) => ({
      key,
      label: <WarehouseTab isAdmin={isAdmin} />,
      children: <WarehouseContent isAdmin={isAdmin} />,
    }))}
  />
)

export default Warehouses
