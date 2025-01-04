import { CellClassParams, ColDef, ColGroupDef, ValueFormatterParams } from '@ag-grid-community/core'
import { map, merge } from 'lodash'

import { Comparator, IRemoteCellStyle, IRemoteDataTableColumn, IRemoteStyleCondition } from '@/stores/datasets'
import { getFormatter } from '@/util/formatters'

type Value = number | string | boolean | null | undefined
type Compare = (sourceValue: Value, referenceValue: Value, comparator: Comparator) => boolean

const compare: Compare = (sourceValue, referenceValue, comparator) => {
  switch (comparator) {
    case Comparator.Always:
      return true

    case Comparator.Contains:
      return (
        typeof sourceValue === 'string' && typeof referenceValue === 'string' && sourceValue.includes(referenceValue)
      )

    case Comparator.StartsWith:
      return (
        typeof sourceValue === 'string' && typeof referenceValue === 'string' && sourceValue.startsWith(referenceValue)
      )

    case Comparator.EndsWith:
      return (
        typeof sourceValue === 'string' && typeof referenceValue === 'string' && sourceValue.endsWith(referenceValue)
      )

    case Comparator.GreaterThan:
      return typeof sourceValue === 'number' && typeof referenceValue === 'number' && sourceValue > referenceValue

    case Comparator.LessThan:
      return typeof sourceValue === 'number' && typeof referenceValue === 'number' && sourceValue < referenceValue

    case Comparator.GreaterThanEqual:
      return typeof sourceValue === 'number' && typeof referenceValue === 'number' && sourceValue >= referenceValue

    case Comparator.LessThanEqual:
      return typeof sourceValue === 'number' && typeof referenceValue === 'number' && sourceValue <= referenceValue

    case Comparator.Equal:
      return sourceValue === referenceValue

    case Comparator.NotEqual:
      return sourceValue !== referenceValue

    case Comparator.NotContains:
      return (
        typeof sourceValue === 'string' && typeof referenceValue === 'string' && !sourceValue.includes(referenceValue)
      )

    case Comparator.NotStartsWith:
      return (
        typeof sourceValue === 'string' && typeof referenceValue === 'string' && !sourceValue.startsWith(referenceValue)
      )

    case Comparator.NotEndsWith:
      return (
        typeof sourceValue === 'string' && typeof referenceValue === 'string' && !sourceValue.endsWith(referenceValue)
      )

    case Comparator.IsNull:
      return sourceValue === null || sourceValue === undefined

    case Comparator.NotIsNull:
      return sourceValue !== null && sourceValue !== undefined

    case Comparator.IsEmpty:
      return (
        sourceValue === null ||
        sourceValue === undefined ||
        (typeof sourceValue === 'string' && sourceValue.trim() === '')
      )

    case Comparator.NotIsEmpty:
      return (
        sourceValue !== null &&
        sourceValue !== undefined &&
        !(typeof sourceValue === 'string' && sourceValue.trim() === '')
      )

    default:
      return false
  }
}

const getStyle = (condition: IRemoteStyleCondition, value: any): IRemoteCellStyle => {
  const { comparator, thresholdValue } = condition
  if (compare(value, thresholdValue, comparator)) return condition.cellStyle || {}
  return {}
}

const getCellStyle = (styleConditions: IRemoteStyleCondition[]) => (params: CellClassParams) => {
  const { value } = params
  const styles = map(styleConditions, (condition) => getStyle(condition, value))
  return merge({}, ...styles)
}

const getColumnDefinition = (column: IRemoteDataTableColumn): ColDef | ColGroupDef => {
  const cellStyle = column.context?.styleConditions ? getCellStyle(column.context.styleConditions) : undefined

  const children = column.children ? column.children.map(getColumnDefinition) : undefined

  return {
    ...column,
    cellStyle,
    children,
  }
}

const getValueFormatter = (format: string) => (params: ValueFormatterParams) => {
  const { value, context } = params
  const formatter = getFormatter(format, context)
  return formatter(value)
}

const getTickerClass = (params: CellClassParams) => {
  const { value } = params
  if (typeof value !== 'number') return
  if (value > 0) return 'text-green-800'
  if (value < 0) return 'text-red-600'
}

const getWrappedStringClass = (params: CellClassParams) => {
  const { value } = params
  if (typeof value !== 'string') return
  return 'text-wrap'
}

const getCellClass = (format: string) => (params: CellClassParams) => {
  switch (format) {
    case 'ticker_decimal':
    case 'ticker_short_decimal':
    case 'ticker_percent':
    case 'ticker_currency':
      return getTickerClass(params)
    case 'wrapped_string':
      return getWrappedStringClass(params)
    default:
      return
  }
}

const getColumnType = (format: string): ColDef | ColGroupDef => {
  const valueFormatter = getValueFormatter(format)
  const cellClass = getCellClass(format)

  return {
    valueFormatter,
    cellClass,
  }
}

export const getColumnTypes = () => ({
  boolean: getColumnType('boolean'),
  boolean_action: getColumnType('boolean_action'),
  currency: getColumnType('currency'),
  decimal: getColumnType('decimal'),
  percent: getColumnType('percent'),
  short_decimal: getColumnType('short_decimal'),
  ticker_decimal: getColumnType('ticker_decimal'),
  ticker_short_decimal: getColumnType('ticker_short_decimal'),
  ticker_percent: getColumnType('ticker_percent'),
  ticker_currency: getColumnType('ticker_currency'),
  date: getColumnType('date'),
  date_time: getColumnType('date_time'),
  distance_to_now: getColumnType('distance_to_now'),
  duration_days: getColumnType('duration_days'),
  duration_hours: getColumnType('duration_hours'),
  duration_minutes: getColumnType('duration_minutes'),
  duration_months: getColumnType('duration_months'),
  duration_seconds: getColumnType('duration_seconds'),
  month: getColumnType('month'),
  quarter: getColumnType('quarter'),
  short_date: getColumnType('short_date'),
  short_date_distance_to_now: getColumnType('short_date_distance_to_now'),
  short_date_time: getColumnType('short_date_time'),
  short_date_time_distance_to_now: getColumnType('short_date_time_distance_to_now'),
  short_time: getColumnType('short_time'),
  year: getColumnType('year'),
  wrapped_string: getColumnType('wrapped_string'),
  string: getColumnType('string'),
})

export const getColumnDefinitions = (columns: IRemoteDataTableColumn[]) => map(columns, getColumnDefinition)
