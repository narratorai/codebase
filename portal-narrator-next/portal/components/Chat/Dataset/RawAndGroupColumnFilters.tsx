import { PlusOutlined } from '@ant-design/icons'
import { Button, Divider } from 'antd-next'
import ColumnFilters, { DEFAULT_SELECTED_FILTER } from 'components/Datasets/Explore/ColumnFilters'
import { ColumnFilterOption } from 'components/Datasets/Explore/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useFormContext } from 'react-hook-form'
import { semiBoldWeight } from 'util/constants'

import PlotForm from './PlotForm'

const addColumnToMeta = (columns: Record<string, unknown>[]) => {
  return columns?.map((column) => ({
    ...column,
    column: column,
  }))
}

const AddRawFilterButton = () => {
  const { setValue, watch } = useFormContext()
  const filters = watch('filters')

  // don't use useFieldArray here because
  // it's not updating the form correctly
  const handleAddRawFilter = () => {
    setValue('filters', [...filters, DEFAULT_SELECTED_FILTER], { shouldValidate: true })
  }

  return (
    <Button icon={<PlusOutlined />} size="small" onClick={handleAddRawFilter}>
      Add Raw Filter
    </Button>
  )
}

const RawColumnFilters = ({ isViewMode }: { isViewMode?: boolean }) => {
  const { watch } = useFormContext()
  const columns = watch('columns')

  const columnsWithMeta = addColumnToMeta(columns)

  return (
    <Box>
      <Typography type="title500" fontWeight={semiBoldWeight} mb={1}>
        Raw Column Filters
      </Typography>

      <ColumnFilters
        hideAddFilterButton
        fieldName="filters"
        column_options={columnsWithMeta as unknown as ColumnFilterOption[]}
        visible
        isViewMode={isViewMode}
      />
    </Box>
  )
}

const AddGroupFilterButton = () => {
  const { setValue, watch } = useFormContext()
  const groupFilters = watch('group_filters')

  // don't use useFieldArray here because
  // it's not updating the form correctly
  const handleAddGroupFilter = () => {
    setValue('group_filters', [...groupFilters, DEFAULT_SELECTED_FILTER], { shouldValidate: true })
  }

  return (
    <Button icon={<PlusOutlined />} size="small" onClick={handleAddGroupFilter}>
      Add Group Filter
    </Button>
  )
}

const GroupColumnFilters = ({ isViewMode }: { isViewMode?: boolean }) => {
  const { watch } = useFormContext()
  const group_columns = watch('group_columns')
  const columnsWithMeta = addColumnToMeta(group_columns)

  return (
    <Box>
      <Typography type="title500" fontWeight={semiBoldWeight} mb={1}>
        Group Column Filters
      </Typography>
      <ColumnFilters
        hideAddFilterButton
        fieldName="group_filters"
        column_options={columnsWithMeta as unknown as ColumnFilterOption[]}
        visible
        isViewMode={isViewMode}
      />
    </Box>
  )
}

const RawAndGroupColumnFilters = ({ isViewMode = false }: { isViewMode?: boolean }) => {
  const { watch } = useFormContext()
  const formValues = watch()

  const filters = formValues?.filters
  const group_filters = formValues?.group_filters

  return (
    <Box>
      <Box my={2}>
        {!isEmpty(filters) && <RawColumnFilters isViewMode={isViewMode} />}
        {!isViewMode && <AddRawFilterButton />}
      </Box>
      <Box my={2}>
        {!isEmpty(group_filters) && <GroupColumnFilters isViewMode={isViewMode} />}
        {!isViewMode && <AddGroupFilterButton />}
      </Box>
      <Divider />
      <Box my={2}>
        <PlotForm isViewMode={isViewMode} />
      </Box>
    </Box>
  )
}

export default RawAndGroupColumnFilters
