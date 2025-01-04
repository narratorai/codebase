import FilterOperatorSelect, {
  makeFilterOperatorOptions,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/FilterOperatorSelect'
import { find, isEmpty } from 'lodash'
import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { IDatasetDefinitionColumn } from 'util/datasets/interfaces'

interface Props {
  fieldName: string
  filterOptions: IDatasetDefinitionColumn[]
}

const CohortFilterOperator = ({ fieldName, filterOptions }: Props) => {
  const { watch, setValue } = useFormContext()

  const columnName = watch(`${fieldName}.cohort_column_name`)

  const cohortColumnType = find(filterOptions, ['name', columnName])?.type

  const operatorValue = watch(`${fieldName}.operator`)
  const operatorOnChange = useCallback(
    (op: string) => {
      setValue(`${fieldName}.operator`, op, { shouldValidate: true })
    },
    [setValue, fieldName]
  )

  // set default operator value
  // or reset to 'equal' if column type changes
  useEffect(() => {
    if (isEmpty(operatorValue)) {
      operatorOnChange('equal')
    }

    // make sure the operator is valid for the column type
    if (!isEmpty(operatorValue) && cohortColumnType) {
      const availableOperatorOptions = makeFilterOperatorOptions({
        columnType: cohortColumnType,
        allowTimeRange: false,
        allowMultiple: false,
      })

      // if the operator doesn't match the column type
      // revert back to 'equal'
      const isAllowedOperator = !!find(availableOperatorOptions, ['value', operatorValue])
      if (!isAllowedOperator) {
        operatorOnChange('equal')
      }
    }
  }, [operatorValue, cohortColumnType, operatorOnChange])

  return (
    <FilterOperatorSelect fieldName={`${fieldName}.operator`} columnType={cohortColumnType} allowTimeRange={false} />
  )
}

export default CohortFilterOperator
