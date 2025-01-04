import { Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { get, isEmpty } from 'lodash'
import { useContext } from 'react'
import { IDatasetQueryGroupMetric } from 'util/datasets/interfaces'

import GroupMetricForm from './GroupMetricForm'

interface Props {
  visible: boolean
}

const GroupMetricModal = ({ visible }: Props) => {
  const { machineCurrent, machineSend } = useContext(DatasetFormContext) || {}

  // Grab the column that you'll eventually swap to pass into mavis in handleSwap
  const { _edit_context: editContext } = machineCurrent.context
  const editColumn = get(editContext, 'event.column') as IDatasetQueryGroupMetric

  const isEdit = !isEmpty(editColumn)

  const onClose = () => {
    machineSend('EDIT_METRIC_COLUMN_CANCEL')
  }

  return (
    <Modal
      title={
        isEdit ? `Update GROUP BY Metric${editColumn?.label ? ` - ${editColumn.label}` : ''}` : 'Add GROUP BY Metric'
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      data-test="group-metric-modal"
    >
      <GroupMetricForm isEdit={isEdit} editColumn={editColumn} onClose={onClose} />
    </Modal>
  )
}

export default GroupMetricModal
