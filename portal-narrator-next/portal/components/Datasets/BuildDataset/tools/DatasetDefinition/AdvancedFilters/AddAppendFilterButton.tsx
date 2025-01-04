import { FilterOutlined, FilterTwoTone } from '@ant-design/icons'
import { Button, Dropdown } from 'antd-next'
import { includes, isEmpty } from 'lodash'
import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  ALL_EVER_RELATIONSHIPS,
  APPEND_ADVANCED_FILTER_OPTIONS,
  COHORT_COLUMN_FILTER,
  DEFAULT_COLUMN_FILTER,
  DEFAULT_TIME_FILTER,
  OCCURRENCE_ALL,
  RELATIVE_ACTIVITY_FILTER,
} from 'util/datasets'

interface Props {
  parentFieldName: string
  disabled?: boolean
}

const AddAppendFilterButton = ({ parentFieldName, disabled = false }: Props) => {
  const { watch, control } = useFormContext()

  const { append: addColumnFilter } = useFieldArray({
    control,
    name: `${parentFieldName}.column_filters`,
  })

  const { append: addRelativeActivityFilter } = useFieldArray({
    control,
    name: `${parentFieldName}.relative_activity_filters`,
  })

  const { append: addCohortColumnFilter } = useFieldArray({
    control,
    name: `${parentFieldName}.cohort_column_filters`,
  })

  const { append: addTimeFilters } = useFieldArray({
    control,
    name: `${parentFieldName}.time_filters`,
  })

  const activityIds = watch(`${parentFieldName}.activity_ids`)
  const relationshipSlug = watch(`${parentFieldName}.relationship_slug`)
  const cohortOccurrenceSlug = watch('cohort.occurrence_filter.occurrence')
  const isAllOccurrence = cohortOccurrenceSlug === OCCURRENCE_ALL
  const onSelect = (value: string) => {
    // Basic column filters
    if (value === 'column_filters') {
      return addColumnFilter(DEFAULT_COLUMN_FILTER)
    }

    if (value === 'relative_activity_filters') {
      return addRelativeActivityFilter(RELATIVE_ACTIVITY_FILTER)
    }

    if (value === 'cohort_column_filters') {
      return addCohortColumnFilter(COHORT_COLUMN_FILTER)
    }

    if (value === 'time_filters') {
      return addTimeFilters(DEFAULT_TIME_FILTER)
    }
  }

  const disabledButton = isEmpty(activityIds) || disabled
  const menuItems = APPEND_ADVANCED_FILTER_OPTIONS.map((option) => {
    // No time_filters are allowed on "ever" relationships
    const shouldDisable =
      isAllOccurrence && includes(ALL_EVER_RELATIONSHIPS, relationshipSlug) && option.value === 'time_filters'

    return {
      key: option.value,
      disabled: shouldDisable,
      onClick: () => onSelect(option.value),
      label: (
        <div>
          ...but only if <strong>{option.label}</strong>
        </div>
      ),
    }
  })

  return (
    <Dropdown disabled={disabledButton} menu={{ items: menuItems }}>
      <Button>{disabledButton ? <FilterOutlined /> : <FilterTwoTone />}</Button>
    </Dropdown>
  )
}

export default AddAppendFilterButton
