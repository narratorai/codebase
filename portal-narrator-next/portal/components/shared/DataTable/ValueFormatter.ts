//
// Returns a function to format a cell value
//

import { ValueFormatterParams } from '@ag-grid-community/core'
import {
  formatShortTime,
  formatShortTimeLocal,
  formatTableTimeStamp,
  formatTimeDay,
  formatTimeDayLocal,
  formatTimeDayMonth,
  formatTimeDayMonthLocal,
  formatTimeRelative,
  formatTimeRelativeLocal,
  commaify,
  percentify,
  timeStampDate,
  decimalify,
  shortDate,
  getDurationFromSeconds,
} from 'util/helpers'
import { isNull, truncate, isFinite, toNumber } from 'lodash'
import moment from 'moment-timezone'

export const NULL_FORMAT_VALUE = '—'

interface FormatValueOptions {
  formatLargeNumbers?: boolean
  truncateLimit?: number
}

interface IColumnFormat {
  label: string
  format: string
}

type FormatterHelper = (value: any) => string

export default class ValueFormatter {
  private _formatMap: Map<string, string> = new Map<string, string>()
  static _currencyFormatter: Intl.NumberFormat
  static _bigCurrencyFormatter: Intl.NumberFormat
  static _bigNumberFormatter: Intl.NumberFormat

  constructor(formats?: IColumnFormat[] | null, companyCurrency?: string | null) {
    formats &&
      formats.forEach((column) => {
        this._formatMap.set(column.label, column.format)
      })

    const companyCurrencyWithDefault = companyCurrency || 'USD'

    // hardcoding 'en-US' until we have a company locale in graph
    const currencyFormat = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrencyWithDefault,
    })

    const bigCurrencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrencyWithDefault,
      notation: 'compact',
      compactDisplay: 'short',
    })

    const bigNumberFormatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    })

    ValueFormatter._currencyFormatter = currencyFormat
    ValueFormatter._bigCurrencyFormatter = bigCurrencyFormatter
    ValueFormatter._bigNumberFormatter = bigNumberFormatter
  }

  getFormatter(columnName: string) {
    const format = this._formatMap.get(columnName)
    return this._getFormatter(format)
  }

  formatValue(format: string, value: any, timezone: string, options?: FormatValueOptions) {
    return this._getFormatter(format)({ value, context: { timezone, options } } as ValueFormatterParams)
  }

  _getFormatter(format: string | undefined) {
    switch (format) {
      case 'date':
        return this.formatDate
      case 'duration':
        return this.formatDuration
      case 'date_short':
        return this.formatShortDate
      case 'week':
        return this.formatWeek
      case 'month':
        return this.formatMonth
      case 'quarter':
        return this.formatQuarter
      case 'year':
        return this.formatYear
      case 'raw_time':
        return this.formatTimestamp
      case 'time':
        return this.formatShortTime
      case 'time_local':
        return this.formatShortTimeLocal
      case 'time_day':
        return this.formatTimeDay
      case 'time_day_local':
        return this.formatTimeDayLocal
      case 'time_day_month':
        return this.formatTimeDayMonth
      case 'time_day_month_local':
        return this.formatTimeDayMonthLocal
      case 'time_relative':
        return this.formatTimeRelative
      case 'time_relative_local':
        return this.formatTimeRelativeLocal
      case 'number':
        return this.formatNumber
      case 'percent':
        return this.formatPercent
      case 'revenue':
        return this.formatCurrency
      case 'boolean':
        return this.formatBoolean
      case 'short_string':
        return this.formatShortString
      case 'id':
      case 'string':
      case undefined:
      default:
        return this.formatString
    }
  }

  formatString(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (value) => value)
  }

  formatShortString(params: ValueFormatterParams): string {
    const truncateLimit = params?.context?.options?.truncateLimit
    // if a truncate limit was set, truncate the string
    if (isFinite(truncateLimit)) {
      return ValueFormatter._doFormat(params.value, (value) => truncate(value, { length: truncateLimit }))
    }

    // otherwise return the string untruncated
    return ValueFormatter._doFormat(params.value, (value) => value)
  }

  formatBoolean(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (value) => (value as boolean).toString())
  }

  formatNumber(params: ValueFormatterParams): string {
    const formatLargeNumbers = params?.context?.options?.formatLargeNumbers
    if (formatLargeNumbers) {
      return ValueFormatter._doFormat(params.value, (value) => ValueFormatter._bigNumberFormatter.format(Number(value)))
    }

    return ValueFormatter._doFormat(params.value, (value) => commaify(decimalify(Number(value))))
  }

  formatTimestamp(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTableTimeStamp(value, timezone))
  }

  formatShortTime(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatShortTime(value, timezone))
  }

  formatShortTimeLocal(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatShortTimeLocal(value, timezone))
  }

  formatTimeDay(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTimeDay(value, timezone))
  }

  formatTimeDayLocal(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTimeDayLocal(value, timezone))
  }

  formatTimeDayMonth(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTimeDayMonth(value, timezone))
  }

  formatTimeDayMonthLocal(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTimeDayMonthLocal(value, timezone))
  }

  formatTimeRelative(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTimeRelative(value, timezone))
  }

  formatTimeRelativeLocal(params: ValueFormatterParams): string {
    const timezone = params.context?.timezone
    return ValueFormatter._doFormat(params.value, (value) => formatTimeRelativeLocal(value, timezone))
  }

  formatPercent(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, percentify)
  }

  formatCurrency(params: ValueFormatterParams): string {
    const formatLargeNumbers = params?.context?.options?.formatLargeNumbers
    if (formatLargeNumbers) {
      return ValueFormatter._doFormat(params.value, ValueFormatter._bigCurrencyFormatter.format)
    }

    return ValueFormatter._doFormat(params.value, ValueFormatter._currencyFormatter.format)
  }

  formatDate(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, timeStampDate)
  }

  formatDuration(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (value) => {
      const valueAsNumber = toNumber(value)
      // format if the value is a number
      if (isFinite(valueAsNumber)) {
        return getDurationFromSeconds(value)
      }

      // otherwise return the value unformatted
      return value
    })
  }

  formatShortDate(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (value) => shortDate(value))
  }

  formatWeek(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (week) => {
      return moment(week).format('[Week] W of YYYY (MMM DD)')
    })
  }

  formatMonth(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (month) => {
      return moment(month).format('MMMM YYYY')
    })
  }

  formatQuarter(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (quarter) => {
      return moment(quarter).format('[Q]Q YYYY')
    })
  }

  formatYear(params: ValueFormatterParams): string {
    return ValueFormatter._doFormat(params.value, (year) => {
      return moment(year).format('YYYY')
    })
  }

  static _doFormat(value: any, formatter: FormatterHelper): string {
    return isNull(value) ? NULL_FORMAT_VALUE : formatter(value)
  }
}
