import { Spin } from 'antd-next'

import { useDeleteWarehouse, useGetWarehouses, useSaveWarehouse } from '../hooks'

interface Props {
  children: React.ReactNode
}

const WarehouseLoading = ({ children }: Props) => {
  const { gettingWarehouses } = useGetWarehouses()
  const { deletingWarehouse } = useDeleteWarehouse()
  const { savingWarehouse } = useSaveWarehouse()

  const loading = gettingWarehouses || deletingWarehouse || savingWarehouse

  return <Spin spinning={loading}>{children}</Spin>
}

export default WarehouseLoading
