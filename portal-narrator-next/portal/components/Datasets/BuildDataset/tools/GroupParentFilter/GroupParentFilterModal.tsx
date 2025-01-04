import { PlusOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Typography } from 'components/shared/jawns'
import { useContext, useEffect } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { DEFAULT_FILTER } from 'util/datasets'

import ParentFilter from './ParentFilter'

interface Props {
  onClose: () => void
}

const GroupParentFilterModal = ({ onClose }: Props) => {
  const { groupIndex, groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext) || {}
  const group = machineCurrent.context.all_groups[groupIndex as number]

  const methods = useForm<any>({
    defaultValues: group,
    mode: 'all',
  })

  const { handleSubmit, formState, control } = methods
  const { isValid } = formState

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parent_filters',
  })

  useEffect(() => {
    machineSend('EDIT_PARENT_FILTERS')
  }, [machineSend])

  const cancelAndClose = () => {
    machineSend('EDIT_PARENT_FILTERS_CANCEL')
    onClose()
  }

  const onSubmit = handleSubmit((formValues: any) => {
    machineSend('EDIT_PARENT_FILTERS_SUBMIT', { groupSlug, filters: formValues.parent_filters })
    onClose()
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Modal
          width="55%"
          style={{ maxWidth: '840px' }}
          open
          title={<Typography type="title400">Pre-filter parent columns before creating GROUP BY</Typography>}
          okText={'Apply'}
          okButtonProps={{ disabled: !isValid, 'data-test': 'add-parent-filters-submit' }}
          onOk={onSubmit}
          onCancel={cancelAndClose}
        >
          {fields.map((fieldName, index) => (
            <ParentFilter
              key={fieldName.id}
              fieldName={`parent_filters.${index}`}
              onClose={() => remove(index)}
              fieldsLength={fields.length}
            />
          ))}

          <Box width={1 / 3} mb={3}>
            <Button
              data-test="add-parent-filter-cta"
              type="dashed"
              shape="round"
              icon={<PlusOutlined />}
              onClick={() =>
                append({
                  filter: DEFAULT_FILTER,
                })
              }
            >
              Add another filter
            </Button>
          </Box>
        </Modal>
      </form>
    </FormProvider>
  )
}

export default GroupParentFilterModal
