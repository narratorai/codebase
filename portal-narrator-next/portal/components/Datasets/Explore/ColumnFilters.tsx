import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { ColumnFiltersAndOptions } from 'components/Datasets/Explore/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import { map } from 'lodash'
import { useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import Column from './Column'

export const DEFAULT_SELECTED_FILTER = {
  column: {},
  column_id: null,
  filter: {},
}

interface Props extends Omit<ColumnFiltersAndOptions, 'selected_filters'> {
  title?: string
  fieldName: string
  hideAddFilterButton?: boolean
  isViewMode?: boolean
}

const ColumnFilters = ({ column_options, title, fieldName, isViewMode, hideAddFilterButton = false }: Props) => {
  const { control } = useFormContext()
  const { fields: selectedFiltersFields, append, remove } = useFieldArray({ control, name: fieldName })

  const columnOptions = useMemo(() => {
    return map(column_options, (op) => ({
      key: op.id,
      label: op.label,
      value: op.id,
      optGroupBy: op.opt_group,
    }))
  }, [column_options])

  return (
    <Box>
      {title && (
        <Typography mb={1} type="title400">
          {title}
        </Typography>
      )}

      {selectedFiltersFields.map((filtersFieldName, index) => (
        <Column
          fieldName={`${fieldName}.${index}`}
          key={filtersFieldName.id}
          columnOptions={columnOptions}
          columnOptionsWithMeta={column_options}
          removeColumn={() => remove(index)}
          isViewMode={isViewMode}
        />
      ))}

      {!hideAddFilterButton && (
        <Box mt={1} ml="21px">
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              append(DEFAULT_SELECTED_FILTER)
            }}
          >
            Add Filter
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default ColumnFilters
