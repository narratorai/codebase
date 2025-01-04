import { isNull } from 'lodash'

import { formatBoolean, formatBooleanAction } from './boolean'
import { DEFAULT_OPTIONS, NULL_FORMAT_VALUE } from './constants'
import { IOptions } from './interfaces'
import { formatDefault } from './misc'
import {
  formatCurrency,
  formatDecimal,
  formatOrdinal,
  formatPercent,
  formatShortDecimal,
  formatTickerCurrency,
  formatTickerDecimal,
  formatTickerPercent,
  formatTickerShortDecimal,
} from './numerics'
import { formatShortString } from './strings'
import {
  formatDate,
  formatDateTime,
  formatDistanceToNow,
  formatDurationDays,
  formatDurationHours,
  formatDurationMinutes,
  formatDurationMonths,
  formatDurationSeconds,
  formatMonthOfYear,
  formatQuarterOfYear,
  formatShortDate,
  formatShortDateDistanceToNow,
  formatShortDateTime,
  formatShortDateTimeDistanceToNow,
  formatShortTime,
  formatYear,
} from './time'

type Formatter = (value: any, options: IOptions) => any

const initializeFormatter = (formatter: Formatter, options?: Partial<IOptions>) => (value: any) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  return isNull(value) ? NULL_FORMAT_VALUE : formatter(value, mergedOptions)
}

const getFormatter = (format: string | undefined | null, options: Partial<IOptions>) => {
  switch (format) {
    case 'boolean':
      return initializeFormatter(formatBoolean, options)
    case 'boolean_action':
      return initializeFormatter(formatBooleanAction, options)
    case 'currency':
      return initializeFormatter(formatCurrency, options)
    case 'decimal':
      return initializeFormatter(formatDecimal, options)
    case 'ordinal':
      return initializeFormatter(formatOrdinal, options)
    case 'percent':
      return initializeFormatter(formatPercent, options)
    case 'short_decimal':
      return initializeFormatter(formatShortDecimal, options)
    case 'ticker_decimal':
      return initializeFormatter(formatTickerDecimal, options)
    case 'ticker_short_decimal':
      return initializeFormatter(formatTickerShortDecimal, options)
    case 'ticker_percent':
      return initializeFormatter(formatTickerPercent, options)
    case 'ticker_currency':
      return initializeFormatter(formatTickerCurrency, options)
    case 'short_string':
      return initializeFormatter(formatShortString, options)
    case 'date':
      return initializeFormatter(formatDate, options)
    case 'date_time':
      return initializeFormatter(formatDateTime, options)
    case 'distance_to_now':
      return initializeFormatter(formatDistanceToNow, options)
    case 'duration_days':
      return initializeFormatter(formatDurationDays, options)
    case 'duration_hours':
      return initializeFormatter(formatDurationHours, options)
    case 'duration_minutes':
      return initializeFormatter(formatDurationMinutes, options)
    case 'duration_months':
      return initializeFormatter(formatDurationMonths, options)
    case 'duration_seconds':
      return initializeFormatter(formatDurationSeconds, options)
    case 'month':
      return initializeFormatter(formatMonthOfYear, options)
    case 'quarter':
      return initializeFormatter(formatQuarterOfYear, options)
    case 'short_date':
      return initializeFormatter(formatShortDate, options)
    case 'short_date_distance_to_now':
      return initializeFormatter(formatShortDateDistanceToNow, options)
    case 'short_date_time':
      return initializeFormatter(formatShortDateTime, options)
    case 'short_date_time_distance_to_now':
      return initializeFormatter(formatShortDateTimeDistanceToNow, options)
    case 'short_time':
      return initializeFormatter(formatShortTime, options)
    case 'year':
      return initializeFormatter(formatYear, options)
    default:
      return initializeFormatter(formatDefault, options)
  }
}

export default getFormatter
