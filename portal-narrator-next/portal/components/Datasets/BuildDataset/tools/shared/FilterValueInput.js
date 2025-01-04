import { AutoComplete, Checkbox, Input } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { includes, isEmpty, isEqual } from 'lodash'
import PropTypes from 'prop-types'
import React, { useContext, useEffect } from 'react'
import { Field, useField } from 'react-final-form'
import {
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_STRING,
  COLUMN_TYPE_TIMESTAMP,
  FILTER_KIND_COLUMN,
  FILTER_KIND_FIELD,
  makeStringFilterAutocompleteOptions,
  MULTI_SELECT_OPERATORS,
  NO_VALUE_OPERATORS,
  NUMBER_COLUMN_TYPES,
  OPERATOR_TIME_RANGE,
} from 'util/datasets'
import { required } from 'util/forms'
import usePrevious from 'util/usePrevious'

import ColumnSelect from './ColumnSelect'
import DatetimeField from './DatetimeField'
import FieldSlugInput from './FieldSlugInput'
import TimeRangeFilter from './TimeRangeFilter/TimeRangeFilter'
import ValueKindSelect from './ValueKindSelect'

const NO_AUTOCOMPLETE_COLUMN_TYPES = [COLUMN_TYPE_BOOLEAN, COLUMN_TYPE_TIMESTAMP, ...NUMBER_COLUMN_TYPES]

export const OrNull = ({ filterFieldName }) => (
  <Field
    name={`${filterFieldName}.or_null`}
    type="checkbox"
    render={({ input }) => <Checkbox {...input}>Or Null</Checkbox>}
  />
)

const FilterValueInput = ({
  columnId,
  columnType,
  filterFieldName,
  hideFilterKind,
  baseDatasetColumnOptions = false,
  columnValues,
}) => {
  const { selectedApiData } = useContext(DatasetFormContext)

  const {
    input: { value: operatorValue },
  } = useField(`${filterFieldName}.operator`, { subscription: { value: true } })

  const {
    input: { onChange: filterValueOnChange },
  } = useField(`${filterFieldName}.value`)

  const {
    input: { value: kindValue },
  } = useField(`${filterFieldName}.kind`, { subscription: { value: true } })

  const prevKindValue = usePrevious(kindValue)
  const multiOperatorSelected = includes(MULTI_SELECT_OPERATORS, operatorValue)

  // CLEAR out the filter value if you change the kind (column_id <-> value)
  useEffect(() => {
    if (prevKindValue && !isEqual(prevKindValue, kindValue)) {
      filterValueOnChange(undefined)
    }
  }, [prevKindValue, kindValue, filterValueOnChange])

  if (includes(NO_VALUE_OPERATORS, operatorValue)) {
    return null
  }

  if (operatorValue === OPERATOR_TIME_RANGE) {
    return <TimeRangeFilter filterFieldName={filterFieldName} omitColumnIds={[columnId]} />
  }

  if (kindValue === FILTER_KIND_COLUMN) {
    return (
      <>
        <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />
        <ColumnSelect
          fieldName={`${filterFieldName}.value`}
          placeholder="Select column"
          columnTypes={[columnType]}
          omitColumnIds={[columnId]}
          baseDatasetColumnOptions={baseDatasetColumnOptions}
          noStyle
        />
      </>
    )
  }

  if (kindValue === FILTER_KIND_FIELD) {
    return (
      <>
        <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />
        <FieldSlugInput fieldName={`${filterFieldName}.value`} />
      </>
    )
  }

  let autocompleteOptions = []

  // Don't show autocomplete for timestamp, boolean, or number column types
  if (!includes(NO_AUTOCOMPLETE_COLUMN_TYPES, columnType)) {
    autocompleteOptions = makeStringFilterAutocompleteOptions({ columnValues, selectedApiData, columnId })
  }
  const showAutocomplete = !isEmpty(autocompleteOptions)

  if (multiOperatorSelected) {
    return (
      <>
        <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />
        <Field
          name={`${filterFieldName}.value`}
          validate={required}
          render={({ input, meta }) => (
            <FormItem noStyle compact {...meta}>
              <SearchSelect
                style={{ minWidth: 100, maxWidth: 400 }}
                mode="tags"
                tokenSeparators={[',']}
                placeholder="Define list"
                notFoundContent={null}
                options={showAutocomplete ? autocompleteOptions : []}
                popupMatchSelectWidth={false}
                {...input}
              />
            </FormItem>
          )}
        />
      </>
    )
  }

  if (columnType === COLUMN_TYPE_TIMESTAMP) {
    return (
      <>
        {!hideFilterKind && <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />}
        <DatetimeField disabled={!operatorValue} fieldName={`${filterFieldName}.value`} />
      </>
    )
  }

  return (
    <>
      {!hideFilterKind && <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />}
      <Field
        name={`${filterFieldName}.value`}
        validate={required}
        render={({ input }) => (
          <>
            {showAutocomplete ? (
              <div data-test="filter-value-input-string">
                <AutoComplete
                  style={{ width: '152px' }}
                  placeholder="e.g. example"
                  disabled={!operatorValue}
                  options={autocompleteOptions}
                  popupMatchSelectWidth={false}
                  {...input}
                />
              </div>
            ) : (
              <div data-test="filter-value-input-string">
                <Input style={{ width: 'auto' }} placeholder="e.g. example" disabled={!operatorValue} {...input} />
              </div>
            )}
          </>
        )}
      />
    </>
  )
}

FilterValueInput.propTypes = {
  columnId: PropTypes.string,
  columnType: PropTypes.string.isRequired,
  filterFieldName: PropTypes.string.isRequired,
  hideFilterKind: PropTypes.bool.isRequired,
  columnValues: PropTypes.array,
}

FilterValueInput.defaultProps = {
  columnType: COLUMN_TYPE_STRING,
  hideFilterKind: false,
}

export default FilterValueInput
