export const NULL_FORMAT_VALUE = '—'

export const SEPARATOR = '\u2022'

export const YEAR_DAYS = 365.2422 // Solar year is 365.2422 days long.

export const MONTH_DAYS = YEAR_DAYS / 12 // 30.43685 // Average month length in days.

export const DAY_HOURS = 24

export const DEFAULT_OPTIONS = {
  currency: 'USD',
  locale: 'en-US',
  timezone: 'America/New_York',
  truncateLimit: Infinity,
}

export const DEFAULT_NUMBER_OPTIONS = {
  localeMatcher: 'best fit',
  maximumFractionDigits: 2,
  notation: 'standard',
  roundingMode: 'halfCeil',
  signDisplay: 'auto',
  trailingZeroDisplay: 'auto',
  useGrouping: 'auto',
} as Intl.NumberFormatOptions

export const DECIMAL_OPTIONS = {
  ...DEFAULT_NUMBER_OPTIONS,
  style: 'decimal',
} as Intl.NumberFormatOptions

export const SHORT_DECIMAL_OPTIONS = {
  ...DEFAULT_NUMBER_OPTIONS,
  compactDisplay: 'short',
  maximumFractionDigits: 0,
  maximumSignificantDigits: 2,
  notation: 'compact',
  roundingPriority: 'morePrecision',
  style: 'decimal',
} as Intl.NumberFormatOptions

export const PERCENT_OPTIONS = {
  ...DEFAULT_NUMBER_OPTIONS,
  style: 'percent',
} as Intl.NumberFormatOptions

export const CURRENCY_OPTIONS = {
  ...DEFAULT_NUMBER_OPTIONS,
  currencyDisplay: 'symbol',
  currencySign: 'standard',
  style: 'currency',
} as Intl.NumberFormatOptions

export const ORDINAL_SUFIXES: { [key: string]: string } = {
  few: 'rd',
  one: 'st',
  other: 'th',
  two: 'nd',
}

export const BOOLEAN_ACTIONS = {
  false: 'Did Not',
  true: 'Did',
}
