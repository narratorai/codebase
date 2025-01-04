import { Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { isEmpty, map } from 'lodash'
import { useContext } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import ColumnOrders from './ColumnOrders'

interface FormValues {
  colIds: string[]
}

/**
 * The overlay
 */
const QuickReorderColumnsModal = () => {
  const { machineCurrent, machineSend, groupSlug, selectedApiData } = useContext(DatasetFormContext)
  const { columns_order } = machineCurrent.context

  const visible = machineCurrent.matches({ edit: 'quick_reorder_columns' })

  // if they have changed order before - grab columns_order from machine
  // otherwise, columns_mapping has up-to-date order
  const slug = groupSlug || 'parent'
  const initialValues = !isEmpty(columns_order?.[slug])
    ? columns_order?.[slug]?.order
    : map(selectedApiData?.column_mapping, (col) => col.id)

  const methods = useForm<FormValues>({
    defaultValues: { colIds: initialValues },
    mode: 'all',
  })

  const { handleSubmit } = methods

  const onSubmit = handleSubmit((formValue: FormValues) => {
    machineSend('EDIT_QUICK_REORDER_COLUMNS_SUBMIT', { groupSlug, colIds: formValue.colIds })
  })

  const handleClose = () => {
    machineSend('EDIT_QUICK_REORDER_COLUMNS_CANCEL')
  }
  return (
    <Modal
      title={<Typography type="title400">Quick Reorder Columns</Typography>}
      open={visible}
      onCancel={handleClose}
      onOk={onSubmit}
      okButtonProps={{ 'data-test': 'quick-reorder-columns-cta' }}
    >
      <FormProvider {...methods}>
        <form>
          <ColumnOrders />
        </form>
      </FormProvider>
    </Modal>
  )
}

export default QuickReorderColumnsModal
