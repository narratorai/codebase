import { Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { OrderColumns } from 'components/Datasets/BuildDataset/tools/shared'
import { Box, Typography } from 'components/shared/jawns'
import { filter, get, map } from 'lodash'
import { useContext, useEffect } from 'react'
import { Form } from 'react-final-form'
import { arrayMutators } from 'util/forms'

interface Props {
  onClose: () => void
}

const OrderByModal = ({ onClose }: Props) => {
  const { groupIndex, groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext) || {}

  // Update state machine
  useEffect(() => {
    machineSend('EDIT_ORDER_BY')
  }, [machineSend])

  const cancelAndClose = () => {
    machineSend('EDIT_ORDER_BY_CANCEL')
    onClose()
  }

  const onSubmit = (formValue: any) => {
    machineSend('EDIT_ORDER_BY_SUBMIT', { orderBy: formValue.order, groupSlug })
    onClose()
  }

  const initialOrderValues = groupSlug
    ? machineCurrent.context.all_groups[groupIndex as number].order
    : machineCurrent.context.order

  const pivotedColumnIds = groupSlug
    ? map(
        filter(machineCurrent.context.all_groups[groupIndex as number].columns, (col) => col.pivoted),
        (pivotedColumn) => pivotedColumn.id
      )
    : undefined

  return (
    <Form
      mutators={arrayMutators}
      // This is going to allow you to edit columnDefinition.filters
      initialValues={{ order: initialOrderValues }}
      onSubmit={onSubmit}
      render={({ handleSubmit, errors }) => {
        const hasError = !!get(errors, 'order')

        return (
          <Modal
            data-test="order-column-by-modal"
            open
            title={<Typography type="title400">Select columns to order rows by</Typography>}
            onCancel={cancelAndClose}
            onOk={handleSubmit}
            okButtonProps={{
              disabled: hasError,
            }}
            okText="Update Order"
          >
            <Box mb={3} p={2} bg="gray200" data-public>
              <Typography type="body200" color="gray600">
                Re order rows by selecting which columns in priority order and direction of sorting that column.
              </Typography>
            </Box>

            <OrderColumns collectionFieldName="order" omitColumnIds={pivotedColumnIds} />
          </Modal>
        )
      }}
    />
  )
}

export default OrderByModal
