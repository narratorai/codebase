import { Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { find, get, isEmpty } from 'lodash'
import { useContext } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { DEFAULT_FILTER, getGroupColumns, getGroupFromContext } from 'util/datasets'
import { IDatasetQueryColumn, IDatasetQueryFilter } from 'util/datasets/interfaces'

import FilterPopoverContent from './FilterPopoverContent'

// define CONSTANT here so it doesn't re-initialize a new object
const FILTER_DEFAULT = { filters: [DEFAULT_FILTER] }

interface FormState {
  filters: IDatasetQueryFilter[]
}

const FilterPopover = () => {
  const { groupSlug, machineSend, machineCurrent } = useContext(DatasetFormContext)

  const columnId = get(machineCurrent.context._edit_context, 'event.column.id')

  const visible = machineCurrent.matches({ edit: 'filter_column' }) && !!columnId
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })
  const columns = group ? getGroupColumns({ group }) : machineCurrent.context.columns
  const columnDefinition = find(columns, ['id', columnId]) as IDatasetQueryColumn

  // Start with a default filter!
  const defaultValues = ((columnDefinition?.filters || []).length > 0 ? columnDefinition : FILTER_DEFAULT) as FormState

  const methods = useForm<FormState>({
    defaultValues,
    mode: 'all',
  })

  const {
    handleSubmit,
    formState: { errors, isValid },
  } = methods

  const closePopover = () => {
    machineSend('EDIT_FILTER_COLUMN_CANCEL')
  }

  const onSubmit = handleSubmit((formValue: any) => {
    machineSend('EDIT_FILTER_COLUMN_SUBMIT', {
      filters: formValue.filters,
      column_id: columnDefinition?.id,
      groupSlug,
    })

    closePopover()
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Modal
          data-test="column-filter-modal"
          title={
            <Typography>
              Filter <strong>{columnDefinition?.label}</strong>
            </Typography>
          }
          open={visible}
          onCancel={closePopover}
          okButtonProps={{ 'data-test': 'apply-column-filter-cta', disabled: !isEmpty(errors) || !isValid }}
          okText="Apply"
          onOk={onSubmit}
          width="560px"
        >
          <FilterPopoverContent columnDefinition={columnDefinition} />
        </Modal>
      </form>
    </FormProvider>
  )
}

export default FilterPopover
