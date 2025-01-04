import { isArray, isFinite, toString, compact, find } from 'lodash'
import moment from 'moment'
import { formatTimeStampUtc, isValidIsoString } from 'util/helpers'

export const OPERATOR_IS_NOT_NULL = 'not_is_null'
export const OPERATOR_IS_NULL = 'is_null'
export const OPERATOR_IN = 'is_in'
export const OPERATOR_NOT_IN = 'not_is_in'
export const OPERATOR_CONTAINS_ANY = 'contains_any'
export const OPERATOR_NOT_CONTAINS_ANY = 'not_contains_any'
export const OPERATOR_IS_EMPTY = 'is_empty'
export const OPERATOR_IS_NOT_EMPTY = 'not_is_empty'

export const OPERATOR_TIME_RANGE = 'time_range'
export const OPERATOR_QUICK_TIME_FILTER = 'quick_time_filter'
export const NO_VALUE_OPERATORS = [OPERATOR_IS_NULL, OPERATOR_IS_NOT_NULL, OPERATOR_IS_EMPTY, OPERATOR_IS_NOT_EMPTY]
export const MULTI_SELECT_OPERATORS = [OPERATOR_IN, OPERATOR_NOT_IN, OPERATOR_CONTAINS_ANY, OPERATOR_NOT_CONTAINS_ANY]

// Given an operator value, what's the operator label:
export const getLabelFromOperatorValue = (operatorValue: string, pluralizeLabels = false) => {
  const allOperatorOptions = [
    ...makeStringOperatorOptions(pluralizeLabels),
    ...makeNumberOperatorOptions(pluralizeLabels),
    ...makeTimeOperatorOptions(pluralizeLabels),
  ]

  return find(allOperatorOptions, ['value', operatorValue])?.label
}

// Given a filter value, return string:
export const makeFilterValueString = (
  filterValue: null | string | number | any[] | moment.Moment,
  timezone: string
) => {
  // moment object --> for timestamp fields
  if (isArray(filterValue)) {
    return JSON.stringify(filterValue)
  }

  if (moment.isMoment(filterValue) || isValidIsoString(filterValue)) {
    return formatTimeStampUtc(filterValue, timezone)
  }

  // string or number --> in most cases
  if (filterValue || isFinite(filterValue)) {
    return toString(filterValue)
  }
}

const makeAllOperatorOptions = (pluralizeLabels: boolean) => {
  return [
    { value: 'equal', label: pluralizeLabels ? 'are equal to' : 'is equal to' },
    { value: 'not_equal', label: pluralizeLabels ? 'are not equal to' : 'is not equal to' },
    { value: OPERATOR_IS_NOT_NULL, label: pluralizeLabels ? 'are not Null' : 'is not Null' },
    { value: OPERATOR_IS_NULL, label: pluralizeLabels ? 'are Null' : 'is Null' },
  ]
}

export const makeBooleanOperatorOptions = (pluralizeLabels: boolean) => {
  return [
    { value: 'equal', label: pluralizeLabels ? 'are equal to' : 'is equal to' },
    { value: OPERATOR_IS_NOT_NULL, label: pluralizeLabels ? 'are not Null' : 'is not Null' },
    { value: OPERATOR_IS_NULL, label: pluralizeLabels ? 'are Null' : 'is Null' },
  ]
}

export const makeStringOperatorOptions = (pluralizeLabels: boolean, allowMultiple = true) => {
  // allowMultiple gives us a flag to disable operators that take multiple values ("contains_any", etc...).
  // For example, we don't want to allow for these operators if the user has selected a field or column as the filter value
  return [
    { value: 'contains', label: pluralizeLabels ? 'contain' : 'contains' },
    { value: 'starts_with', label: pluralizeLabels ? 'start with' : 'starts with' },
    { value: 'ends_with', label: pluralizeLabels ? 'end with' : 'ends with' },
    { value: OPERATOR_IN, label: pluralizeLabels ? 'are in' : 'is in', disabled: !allowMultiple },
    { value: OPERATOR_CONTAINS_ANY, label: pluralizeLabels ? 'contain any' : 'contains any', disabled: !allowMultiple },
    {
      value: OPERATOR_NOT_CONTAINS_ANY,
      label: pluralizeLabels ? 'do not contain any' : 'does not contain any',
      disabled: !allowMultiple,
    },
    { value: 'not_contain', label: pluralizeLabels ? 'do not contain' : 'does not contain' },
    { value: 'not_starts_with', label: pluralizeLabels ? 'do not start with' : 'does not start with' },
    { value: 'not_ends_with', label: pluralizeLabels ? 'do not end with' : 'does not end with' },
    { value: OPERATOR_NOT_IN, label: pluralizeLabels ? 'are not in' : 'is not in', disabled: !allowMultiple },
    { value: OPERATOR_IS_EMPTY, label: pluralizeLabels ? 'are empty strings' : 'is empty string' },
    { value: OPERATOR_IS_NOT_EMPTY, label: pluralizeLabels ? 'are not empty strings' : 'is not empty string' },
    ...makeAllOperatorOptions(pluralizeLabels),
  ]
}

export const makeNumberOperatorOptions = (pluralizeLabels: boolean) => {
  return [
    { value: 'greater_than', label: pluralizeLabels ? 'are greater than' : 'is greater than' },
    { value: 'less_than', label: pluralizeLabels ? 'are less than' : 'is less than' },
    {
      value: 'greater_than_equal',
      label: pluralizeLabels ? 'are greater than or equal to' : 'is greater than or equal to',
    },
    { value: 'less_than_equal', label: pluralizeLabels ? 'are less than or equal to' : 'is less than or equal to' },
    ...makeAllOperatorOptions(pluralizeLabels),
  ]
}

export const makeTimeOperatorOptions = (pluralizeLabels: boolean, allowTimeRange?: boolean) => {
  return compact([
    allowTimeRange
      ? { value: OPERATOR_QUICK_TIME_FILTER, label: pluralizeLabels ? 'are within...' : 'is within...' }
      : undefined,
    allowTimeRange
      ? { value: OPERATOR_TIME_RANGE, label: pluralizeLabels ? 'are within range...' : 'is within range...' }
      : undefined,
    { value: 'greater_than', label: pluralizeLabels ? 'are greater than' : 'is greater than' },
    { value: 'less_than', label: pluralizeLabels ? 'are less than' : 'is less than' },
    {
      value: 'greater_than_equal',
      label: pluralizeLabels ? 'are greater than or equal to' : 'is greater than or equal to',
    },
    { value: 'less_than_equal', label: pluralizeLabels ? 'are less than or equal to' : 'is less than or equal to' },
    ...makeAllOperatorOptions(pluralizeLabels),
  ])
}
