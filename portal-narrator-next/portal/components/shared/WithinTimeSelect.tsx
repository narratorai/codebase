import { SearchSelect } from 'components/antd/staged'
import QuickTimeFilter, {
  WithinTimeFilterDefaultValues,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/QuickTimeFilter'
import TimeRangeFilter from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/TimeRangeFilter/TimeRangeFilter'
import { ValueKindOptionOverrides } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/ValueKindSelect'
import { Box, Flex } from 'components/shared/jawns'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { OPERATOR_QUICK_TIME_FILTER, OPERATOR_TIME_RANGE } from 'util/datasets/v2/filterHelpers'
import { required } from 'util/forms'

const OPERATOR_FIELDNAME_SUFFIX = 'operator'

const makeWithinTimeOperatorOptions = (pluralizeLabels: boolean) => {
  return [
    { value: OPERATOR_QUICK_TIME_FILTER, label: pluralizeLabels ? 'are within...' : 'is within...' },
    { value: OPERATOR_TIME_RANGE, label: pluralizeLabels ? 'are within range...' : 'is within range...' },
  ]
}

interface Props {
  fieldName: string
  pluralizeLabels?: boolean
  isRequired?: boolean
  valueKindOptionOverrides?: ValueKindOptionOverrides
  quickTimeFilterDefaultValue?: WithinTimeFilterDefaultValues
}

const WithinTimeSelect: React.FC<Props> = ({
  fieldName,
  pluralizeLabels = false,
  isRequired = false,
  valueKindOptionOverrides,
  quickTimeFilterDefaultValue,
  ...props
}) => {
  const { control, watch } = useFormContext()
  const operatorFieldname = `${fieldName}.${OPERATOR_FIELDNAME_SUFFIX}`
  const operatorValue = watch(operatorFieldname)
  const operatorOptions = makeWithinTimeOperatorOptions(pluralizeLabels)

  return (
    <Flex alignItems="baseline" flexWrap="wrap">
      <Flex mr={1}>
        <Controller
          control={control}
          name={operatorFieldname}
          rules={{ validate: isRequired ? required : undefined }}
          render={({ field }) => (
            <SearchSelect
              options={operatorOptions}
              placeholder="Time Filter"
              style={{ minWidth: '120px' }}
              allowClear
              {...field}
              // listen to operatorValue instead of field.value
              // to stay up-to-date with clear
              value={operatorValue}
              {...props}
            />
          )}
        />
      </Flex>

      <Box mr={1}>
        {operatorValue === OPERATOR_QUICK_TIME_FILTER && (
          <QuickTimeFilter fieldName={`${fieldName}.value`} isRequired defaultValue={quickTimeFilterDefaultValue} />
        )}

        {operatorValue === OPERATOR_TIME_RANGE && (
          <TimeRangeFilter filterFieldName={fieldName} valueKindOptionOverrides={valueKindOptionOverrides} />
        )}
      </Box>
    </Flex>
  )
}

export default WithinTimeSelect
