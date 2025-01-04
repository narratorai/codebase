import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { Box } from 'components/shared/jawns'
import { useCallback } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { DEFAULT_FILTER } from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'

import FilterCard from './FilterCard'

interface Props {
  columnDefinition: IDatasetQueryColumn
}

const FilterPopoverContent = ({ columnDefinition }: Props) => {
  const { control } = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'filters',
  })

  const handleRemove = useCallback(
    (index: number) => {
      remove(index)
    },
    [remove]
  )

  return (
    <Box data-public>
      {fields.map((fieldName, index) => (
        <FilterCard
          key={fieldName.id}
          columnDefinition={columnDefinition}
          fieldName={`filters.${index}`}
          handleRemove={() => handleRemove(index)}
        />
      ))}

      <Button type="dashed" shape="round" icon={<PlusOutlined />} onClick={() => append(DEFAULT_FILTER)}>
        Add another filter
      </Button>
    </Box>
  )
}

export default FilterPopoverContent
