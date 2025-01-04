import { useFieldArray, useFormContext } from 'react-hook-form'
import { IDefinitionTimeFilter } from 'util/datasets/interfaces'

import TimeFilter from './TimeFilter'

interface Props {
  parentFieldName: string
  isViewMode?: boolean
}

const TimeFilters = ({ parentFieldName, isViewMode }: Props) => {
  const { control, watch } = useFormContext()

  const fieldName = `${parentFieldName}.time_filters`
  const timeFilters = watch(fieldName)
  const { remove } = useFieldArray({ control, name: fieldName })

  return timeFilters?.map((_: IDefinitionTimeFilter, index: number) => (
    <TimeFilter
      key={index}
      fieldName={`${fieldName}.${index}`}
      control={control}
      onRemove={() => remove(index)}
      parentFieldName={parentFieldName}
      isViewMode={isViewMode}
    />
  ))
}

export default TimeFilters
