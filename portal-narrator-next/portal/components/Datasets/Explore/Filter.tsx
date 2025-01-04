import { Input } from 'antd-next'
import { FilterOperatorSelect, OrNull } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { ColumnFilterOption } from 'components/Datasets/Explore/interfaces'
import { Box, Flex } from 'components/shared/jawns'
import { includes } from 'lodash'
import pluralize from 'pluralize'
import { useFormContext } from 'react-hook-form'
import {
  COLUMN_TYPE_STRING,
  FILTER_KIND_VALUE,
  OPERATOR_IS_NOT_NULL,
  OPERATOR_IS_NULL,
  OPERATOR_TIME_RANGE,
} from 'util/datasets'

import RenderFilterValueInput from './RenderFilterValueInput'

interface Props {
  fieldName: string
  column: ColumnFilterOption['column']
}

const Filter = ({ fieldName, column }: Props) => {
  const { watch } = useFormContext()

  const filterValue = watch(fieldName)
  const kind = filterValue?.kind
  const operator = filterValue?.operator

  const isTimeRangeOperation = operator === OPERATOR_TIME_RANGE
  const isNullOperation = includes([OPERATOR_IS_NOT_NULL, OPERATOR_IS_NULL], operator)
  const pluralizeOperator = pluralize.isPlural(column?.label || '')

  return (
    <Flex alignItems="center">
      <Box mr={1}>
        <Input.Group compact>
          <FilterOperatorSelect
            columnType={column?.type || COLUMN_TYPE_STRING}
            fieldName={`${fieldName}.operator`}
            pluralizeLabels={pluralizeOperator}
            kind={kind}
          />
          {!isTimeRangeOperation && <RenderFilterValueInput column={column} fieldName={fieldName} />}
        </Input.Group>
      </Box>

      <Flex alignItems="center" flexWrap="wrap">
        {isTimeRangeOperation && (
          <Flex flexWrap="wrap">
            <RenderFilterValueInput
              column={column}
              fieldName={fieldName}
              // only show value in time range (no column or field)
              valueKindOptionOverrides={[FILTER_KIND_VALUE]}
            />
          </Flex>
        )}

        {!isNullOperation && (
          <Box width="80px" ml={1} style={{ whiteSpace: 'nowrap' }}>
            <OrNull filterFieldName={fieldName} />
          </Box>
        )}
      </Flex>
    </Flex>
  )
}

export default Filter
