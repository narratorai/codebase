import { AutoComplete, Input } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ValueKindOptionOverrides } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/ValueKindSelect'
import { includes, isBoolean, isEmpty, isEqual } from 'lodash'
import { useContext, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
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
  OPERATOR_QUICK_TIME_FILTER,
  OPERATOR_TIME_RANGE,
} from 'util/datasets'
import { required } from 'util/forms'
import usePrevious from 'util/usePrevious'

import BooleanSelect from './BooleanSelect'
import ColumnSelect from './ColumnSelect'
import DatetimeField from './DatetimeField'
import FieldSlugInput from './FieldSlugInput'
import QuickTimeFilter from './QuickTimeFilter'
import TimeRangeFilter from './TimeRangeFilter/TimeRangeFilter'
import ValueKindSelect from './ValueKindSelect'

const NO_AUTOCOMPLETE_COLUMN_TYPES = [COLUMN_TYPE_BOOLEAN, COLUMN_TYPE_TIMESTAMP, ...NUMBER_COLUMN_TYPES]

interface Props {
  columnId?: string
  columnType?: string
  filterFieldName: string
  hideFilterKind?: boolean
  baseDatasetColumnOptions?: boolean
  columnValues?: any[]
  hideValueKinds?: boolean
  valueKindOptionOverrides?: ValueKindOptionOverrides
}

const FilterValueInput = ({
  columnId,
  columnType = COLUMN_TYPE_STRING,
  filterFieldName,
  hideFilterKind = false,
  baseDatasetColumnOptions = false,
  columnValues,
  hideValueKinds = false,
  valueKindOptionOverrides,
}: Props) => {
  const { selectedApiData } = useContext(DatasetFormContext)

  const { watch, setValue, control } = useFormContext()

  const filterValue = watch(`${filterFieldName}.value`)

  const filterValueOnChange = (value?: string | string[]) =>
    setValue(`${filterFieldName}.value`, value, { shouldValidate: true })

  const operatorValue = watch(`${filterFieldName}.operator`)

  const multiOperatorSelected = includes(MULTI_SELECT_OPERATORS, operatorValue)
  const prevMultiOperatorSelected = usePrevious(multiOperatorSelected)

  const kindValue = watch(`${filterFieldName}.kind`)
  const prevKindValue = usePrevious(kindValue)

  const defaultFilterValue = multiOperatorSelected ? [] : ''

  // when switching from multi <-> single operator
  // convert the value to an array or string
  useEffect(() => {
    if (isBoolean(prevMultiOperatorSelected) && isEqual(prevMultiOperatorSelected, !multiOperatorSelected)) {
      // if now multi operator, convert value to array
      if (multiOperatorSelected) {
        const newFilterValue = isEmpty(filterValue) ? [] : filterValue.split(',')
        filterValueOnChange(newFilterValue)
      }

      // if now a single operator, convert value to string
      if (!multiOperatorSelected) {
        const newFilterValue = isEmpty(filterValue) ? '' : filterValue.join(',')
        filterValueOnChange(newFilterValue)
      }
    }
  }, [prevMultiOperatorSelected, multiOperatorSelected, filterValue, filterValueOnChange])

  // CLEAR out the filter value if you change the kind (column_id <-> value)
  useEffect(() => {
    if (prevKindValue && !isEqual(prevKindValue, kindValue)) {
      filterValueOnChange(defaultFilterValue)
    }
  }, [prevKindValue, kindValue, filterValueOnChange, defaultFilterValue])

  // clear value when switching to no value operator
  // i.e. if you had "is equal" to value "xyx" and change to "is null"
  // you don't want to persist value "xyz"
  // ALSO force revalidation - to make "accept" cta enabled
  const isNoValueOperator = includes(NO_VALUE_OPERATORS, operatorValue)
  const prevIsNovalueOperator = usePrevious(isNoValueOperator)
  useEffect(() => {
    if (!prevIsNovalueOperator && isNoValueOperator) {
      filterValueOnChange(defaultFilterValue)
    }
  }, [prevIsNovalueOperator, isNoValueOperator, filterValueOnChange, defaultFilterValue])

  const isQuickTimeFilter = operatorValue === OPERATOR_QUICK_TIME_FILTER
  const prevIsQuickTimeFilter = usePrevious(isQuickTimeFilter)

  // clear values when switching from quick_time_filter to another time filter
  // (quick time filter uses strings - not date)
  useEffect(() => {
    if (prevIsQuickTimeFilter && !isQuickTimeFilter) {
      filterValueOnChange(defaultFilterValue)
    }
  }, [prevIsQuickTimeFilter, isQuickTimeFilter, filterValueOnChange, defaultFilterValue])

  const omitColumnIds = columnId ? [columnId] : []

  if (isNoValueOperator) {
    return null
  }

  if (operatorValue === OPERATOR_TIME_RANGE) {
    return (
      <TimeRangeFilter
        filterFieldName={filterFieldName}
        omitColumnIds={omitColumnIds}
        hideValueKinds={hideValueKinds}
        // for now this is the only place where we need to limit
        // the value kind options (i.e. only show "value" when in explore)
        valueKindOptionOverrides={valueKindOptionOverrides}
      />
    )
  }

  if (operatorValue === OPERATOR_QUICK_TIME_FILTER) {
    return <QuickTimeFilter fieldName={`${filterFieldName}.value`} defaultValue="last_30_days" isRequired />
  }

  if (kindValue === FILTER_KIND_COLUMN) {
    let selectableColumnTypes: string[] = [columnType]

    // check if columnType is one of the number types
    // (if so, let user compare values of the other number type columns as well)
    // i.e. "float" should be able to compare with "integer" or "number"
    if (includes(NUMBER_COLUMN_TYPES, columnType)) {
      selectableColumnTypes = NUMBER_COLUMN_TYPES
    }

    return (
      <>
        {!hideValueKinds && <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />}
        <ColumnSelect
          fieldName={`${filterFieldName}.value`}
          placeholder="Select column"
          columnTypes={selectableColumnTypes}
          omitColumnIds={omitColumnIds}
          baseDatasetColumnOptions={baseDatasetColumnOptions}
          noStyle
        />
      </>
    )
  }

  if (kindValue === FILTER_KIND_FIELD) {
    return (
      <>
        {!hideValueKinds && <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />}
        <FieldSlugInput fieldName={`${filterFieldName}.value`} />
      </>
    )
  }

  if (columnType === COLUMN_TYPE_BOOLEAN) {
    return <BooleanSelect filterFieldName={filterFieldName} />
  }

  let autocompleteOptions: { value: string; label: string }[] = []

  // Don't show autocomplete for timestamp, boolean, or number column types
  if (!includes(NO_AUTOCOMPLETE_COLUMN_TYPES, columnType)) {
    autocompleteOptions = makeStringFilterAutocompleteOptions({ columnValues, selectedApiData, columnId })
  }
  const showAutocomplete = !isEmpty(autocompleteOptions)

  if (multiOperatorSelected) {
    return (
      <>
        {!hideValueKinds && <ValueKindSelect fieldName={`${filterFieldName}.kind`} operatorSelected={operatorValue} />}

        <Controller
          control={control}
          rules={{ validate: required }}
          name={`${filterFieldName}.value`}
          render={({ field, fieldState: { isTouched: touched, error } }) => (
            <FormItem noStyle compact meta={{ touched, error: error?.message }}>
              <SearchSelect
                style={{ minWidth: 100, maxWidth: 400 }}
                mode="tags"
                tokenSeparators={[',']}
                placeholder="Define list"
                notFoundContent={null}
                options={showAutocomplete ? autocompleteOptions : []}
                popupMatchSelectWidth={false}
                {...field}
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
      <Controller
        control={control}
        rules={{ validate: required }}
        name={`${filterFieldName}.value`}
        render={({ field }) =>
          showAutocomplete ? (
            <div data-test="filter-value-input-string">
              <AutoComplete
                style={{ width: '152px' }}
                placeholder="e.g. example"
                disabled={!operatorValue}
                options={autocompleteOptions}
                popupMatchSelectWidth={false}
                {...field}
              />
            </div>
          ) : (
            <div data-test="filter-value-input-string">
              <Input
                style={{ width: 'auto' }}
                placeholder="e.g. example"
                disabled={!operatorValue}
                aria-label="text-input"
                {...field}
              />
            </div>
          )
        }
      />
    </>
  )
}

export default FilterValueInput
