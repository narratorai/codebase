import { CURRENCY_OPTIONS, DECIMAL_OPTIONS, ORDINAL_SUFIXES, PERCENT_OPTIONS, SHORT_DECIMAL_OPTIONS } from './constants'
import { IOptions } from './interfaces'

const getTickerPrefixer = (value: number): ((formattedValue: string) => string) => {
  const arrowUp = '\u2191'
  const arrowDown = '\u2193'

  return (formattedValue: string) => {
    if (value > 0) return `${arrowUp} ${formattedValue}`
    if (value < 0) return `${arrowDown} ${formattedValue}`
    return formattedValue
  }
}

export const formatOrdinal = (value: number, options: IOptions): string => {
  const { locale } = options

  const pluralRules = new Intl.PluralRules(locale, { type: 'ordinal' })
  const rule = pluralRules.select(value)
  const sufix = ORDINAL_SUFIXES[rule]
  return `${value}${sufix}`
}

export const formatDecimal = (value: number, options: IOptions): string => {
  const { locale } = options

  const formatter = new Intl.NumberFormat(locale, DECIMAL_OPTIONS)
  return formatter.format(Number(value))
}

export const formatShortDecimal = (value: number | string, options: IOptions): string => {
  const { locale } = options
  // TODO: Investigate why value provided by antd charts is sometimes a string
  const valueToFormat = typeof value === 'string' ? value.replace(/,/g, '') : value

  const formatter = new Intl.NumberFormat(locale, SHORT_DECIMAL_OPTIONS)
  return formatter.format(Number(valueToFormat))
}

export const formatPercent = (value: number, options: IOptions): string => {
  const { locale } = options

  const formatter = new Intl.NumberFormat(locale, PERCENT_OPTIONS)
  return formatter.format(Number(value))
}

export const formatCurrency = (value: number, options: IOptions): string => {
  const { currency, locale } = options

  const formatter = new Intl.NumberFormat(locale, { ...CURRENCY_OPTIONS, currency })
  return formatter.format(Number(value))
}

export const formatTickerDecimal = (value: number, options: IOptions): string => {
  const prefixer = getTickerPrefixer(value)
  return prefixer(formatDecimal(value, options))
}

export const formatTickerShortDecimal = (value: number, options: IOptions): string => {
  const prefixer = getTickerPrefixer(value)
  return prefixer(formatShortDecimal(value, options))
}

export const formatTickerPercent = (value: number, options: IOptions): string => {
  const prefixer = getTickerPrefixer(value)
  return prefixer(formatPercent(value, options))
}

export const formatTickerCurrency = (value: number, options: IOptions): string => {
  const prefixer = getTickerPrefixer(value)
  return prefixer(formatCurrency(value, options))
}
