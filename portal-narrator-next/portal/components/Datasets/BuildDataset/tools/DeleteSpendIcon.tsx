import { DeleteOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { useContext } from 'react'
import { colors } from 'util/constants'
import { IDatasetFormContext } from 'util/datasets/interfaces'

const DeleteSpendIcon = () => {
  const { groupSlug, machineSend } = useContext<IDatasetFormContext>(DatasetFormContext) || {}

  const onRemove = () => {
    machineSend('SUBMITTING_DELETE_SPEND_COLUMNS', { groupSlug })
  }

  return (
    <Tooltip title="Delete Aggregation Columns">
      <Button size="small" type="link" onClick={onRemove} icon={<DeleteOutlined style={{ color: colors.red500 }} />} />
    </Tooltip>
  )
}

export default DeleteSpendIcon
