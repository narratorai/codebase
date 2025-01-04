import { Modal, Spin } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ColumnSelect } from 'components/Datasets/BuildDataset/tools/shared'
import MachineError from 'components/Datasets/BuildDataset/tools/shared/MachineError'
import { Typography } from 'components/shared/jawns'
import { find, get } from 'lodash'
import { useContext } from 'react'
import { Form } from 'react-final-form'
import { getGroupFromContext } from 'util/datasets'
import { IDatasetQueryGroupColumn } from 'util/datasets/interfaces'

const SwapColumnModal = () => {
  const { machineCurrent, machineSend, groupSlug } = useContext(DatasetFormContext)

  const visible = machineCurrent.matches({ edit: 'swap_group_column' })
  const submitting = machineCurrent.matches({ api: 'submitting_swap_group_column' })

  // Grab the column that you'll eventually swap to pass into mavis in handleSwap
  const { _edit_context: editContext, columns } = machineCurrent.context
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const replacedColumn = get(editContext, 'event.column') as IDatasetQueryGroupColumn

  const handleSwap = (values: any) => {
    machineSend('EDIT_SWAP_GROUP_COLUMN_SUBMIT', {
      groupSlug,
      column: replacedColumn,
      parentColumnId: values.parent_column_id,
    })
  }

  const handleClose = () => {
    machineSend('EDIT_SWAP_GROUP_COLUMN_CANCEL')
  }

  if (!group || !replacedColumn) {
    return null
  }

  // if parent column or replaced column have been renamed
  // make sure to include the "(parent column)"  text
  // so they can find it in the dropdown
  const parentColumn = find(columns, ['id', replacedColumn.column_id])
  const swapColumnLabel =
    parentColumn?.label && parentColumn.label !== replacedColumn?.label
      ? `${replacedColumn.label} (${parentColumn.label})`
      : replacedColumn.label

  return (
    <Form
      onSubmit={handleSwap}
      render={({ handleSubmit }) => (
        <Modal
          title={<Typography type="title400">Swap Column - {replacedColumn.label}</Typography>}
          open={visible}
          onCancel={handleClose}
          onOk={handleSubmit}
        >
          <Spin spinning={submitting}>
            <MachineError />
            <ColumnSelect
              fieldName="parent_column_id"
              labelText={`Replace ${swapColumnLabel} with`}
              omitColumnIds={[replacedColumn.column_id]}
              baseDatasetColumnOptions
            />
          </Spin>
        </Modal>
      )}
    />
  )
}

export default SwapColumnModal
