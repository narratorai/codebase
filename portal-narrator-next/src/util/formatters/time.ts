/* eslint-disable simple-import-sort/imports */

/**
 * We must import entire namespaces.
 * Importing individual functions will
 * cause missing refference errors
 * when using locales.
 */
import * as dateFns from 'date-fns'
import * as dateFnsTZ from 'date-fns-tz'
import * as LOCALES from 'date-fns/locale'

import { IOptions } from './interfaces'

import { DAY_HOURS, MONTH_DAYS, SEPARATOR } from './constants'

/** 60 -> 1 (60 / 30.43685 = 1.9712946641981677) */
export const daysToMonths = (value: number): number => Math.floor(value / MONTH_DAYS)

// Edge cases may fail to produce correct results. This may need improvement.
/** 2 -> 61 (2 * 30.43685 = 60.8737)  */
export const monthsToDays = (value: number): number => Math.round(value * MONTH_DAYS)

/** 26 -> 1 (26 / 24 = 1.0833333333333333) */
export const hoursToDays = (value: number): number => Math.floor(value / DAY_HOURS)

/** 2 -> 48 */
export const daysToHours = (value: number): number => value * DAY_HOURS

/**
 * Determine if the date is in UTC time zone.
 */
const isUTC = (value: string | Date): boolean => {
  const dateObject = value instanceof Date ? value : new Date(value)
  return dateObject.getTimezoneOffset() === 0
}

export const getLocalOptions = (): Intl.ResolvedDateTimeFormatOptions => {
  const format = Intl.DateTimeFormat()
  return format.resolvedOptions()
}

const selectOptions = (value: string | Date, options: IOptions): Intl.ResolvedDateTimeFormatOptions | IOptions =>
  isUTC(value) ? getLocalOptions() : options

export const getLocale = (code: string | undefined): LOCALES.Locale => {
  if (!code) return LOCALES.enUS
  const key = code.replace(/-/g, '') as keyof typeof LOCALES
  return LOCALES[key]
}

/**
 * If the date is in UTC time zone, we return the system locale.
 * Otherwise, we return the given locale.
 */
const selectLocale = (value: string | Date, options: IOptions): LOCALES.Locale => {
  const { locale } = selectOptions(value, options)
  return getLocale(locale)
}

/**
 * If the date is in UTC time zone, we return the system timezone.
 * Otherwise, we return no timezone (undefined).
 */
const selectTimeZone = (value: string | Date): string | undefined => {
  const { timeZone } = selectOptions(value, {})
  return timeZone
}

/**
 * If the date is in UTC format, we adjust it to the system timezone.
 *
 * Finally, we return ISO formatted date string.
 */
export const adjustTimeZone = (value: string | Date): string => {
  const timeZone = selectTimeZone(value)
  return dateFnsTZ.format(value, "yyyy-MM-dd'T'HH:mm:ss.SSS", { timeZone })
}

/**
 * If the date is in UTC time zone,
 * we convert it to the system timezone and format it with the system locale.
 *
 * Otherwise, we format it with the given locale, ignoring the timezone conversion.
 *
 */
const formatPart = (value: string | Date, options: IOptions, formatStr: string): string => {
  const adjustedDate = adjustTimeZone(value)
  const locale = selectLocale(value, options)
  return dateFnsTZ.format(adjustedDate, formatStr, { locale })
}

/** Measures distance between the two ISO string dates adjusted to system timezone */
export const formatDistance = (value: string | Date, baseDate: string | Date, options: IOptions): string => {
  const adjustedDate = adjustTimeZone(value)
  const adjustedBaseDate = adjustTimeZone(baseDate)
  const locale = selectLocale(value, options)
  return dateFns.formatDistance(adjustedDate, adjustedBaseDate, { addSuffix: true, includeSeconds: true, locale })
}

export const formatDuration = (value: dateFns.Duration): string => {
  const { locale: localeString } = getLocalOptions()
  const locale = getLocale(localeString)
  const zero = false
  const delimiter = ', '
  return dateFns.formatDuration(value, { delimiter, locale, zero })
}

/** 2024-05-16T15:30:45.678-00:00 -> 2024 */
export const formatYear = (value: string | Date, options: IOptions): string => formatPart(value, options, 'yyyy')

/** 2024-05-16T15:30:45.678-00:00 -> Q2 2024 */
export const formatQuarterOfYear = (value: string | Date, options: IOptions): string =>
  formatPart(value, options, 'QQQ yyyy')

/** 2024-05-16T15:30:45.678-00:00 -> May 2024 */
export const formatMonthOfYear = (value: string | Date, options: IOptions): string =>
  formatPart(value, options, 'MMMM yyyy')

/** 2024-05-16T15:30:45.678-00:00 -> 05/16/2024, 3:30 PM */
export const formatShortDateTime = (value: string | Date, options: IOptions): string => formatPart(value, options, 'Pp')

/** 2024-05-16T15:30:45.678-00:00 -> May 16, 2024, 3:30 PM UTC */
export const formatDateTime = (value: string | Date, options: IOptions): string => formatPart(value, options, 'PPp z')

/** 2024-05-16T15:30:45.678-00:00 -> 05/16/2024 */
export const formatShortDate = (value: string | Date, options: IOptions): string => formatPart(value, options, 'P')

/** 2024-05-16T15:30:45.678-00:00 -> May 16, 2024 */
export const formatDate = (value: string | Date, options: IOptions): string => formatPart(value, options, 'PP')

/** 2024-05-16T15:30:45.678-00:00 -> 3:30 PM */
export const formatShortTime = (value: string | Date, options: IOptions): string => formatPart(value, options, 'p')

/** 2024-05-16T15:30:45.678-00:00 -> 1 day ago */
export const formatDistanceToNow = (value: string | Date, options: IOptions): string => {
  const now = new Date()
  const baseDate = now.toISOString()
  return formatDistance(value, baseDate, options)
}

/** 2024-05-16T15:30:45.678-00:00 -> 05/16/2024, 3:30 PM UTC • 1 day ago */
export const formatShortDateTimeDistanceToNow = (value: string | Date, options: IOptions): string => {
  const shortDateTime = formatShortDateTime(value, options)
  const relativeTime = formatDistanceToNow(value, options)
  return `${shortDateTime} ${SEPARATOR} ${relativeTime}`
}

/** 2024-05-16T15:30:45.678-00:00 -> 05/16/2024 • 1 day ago */
export const formatShortDateDistanceToNow = (value: string | Date, options: IOptions): string => {
  const shortDate = formatShortDate(value, options)
  const relativeTime = formatDistanceToNow(value, options)
  return `${shortDate} ${SEPARATOR} ${relativeTime}`
}

/** Same as formatShortDateTimeDistanceToNow with the arbitrary base date.  */
export const formatShortDateTimeDistance = (
  value: string | Date,
  baseDate: string | Date,
  options: IOptions
): string => {
  const shortDateTime = formatShortDateTime(value, options)
  const relativeTime = formatDistance(value, baseDate, options)
  return `${shortDateTime} ${SEPARATOR} ${relativeTime}`
}

/** Same as formatShortDateDistanceToNow with the arbitrary base date.  */
export const formatShortDateDistance = (value: string | Date, baseDate: string | Date, options: IOptions): string => {
  const shortDate = formatShortDate(value, options)
  const relativeTime = formatDistance(value, baseDate, options)
  return `${shortDate} ${SEPARATOR} ${relativeTime}`
}

export const formatMonthsToComponents = (value: number): dateFns.Duration => {
  const years = dateFns.monthsToYears(value)
  const months = value - dateFns.yearsToMonths(years)
  return { months, years }
}

export const formatDaysToComponents = (value: number): dateFns.Duration => {
  const months = daysToMonths(value)
  const days = value - monthsToDays(months)
  const components = formatMonthsToComponents(months)
  return { ...components, days }
}

export const formatHoursToComponents = (value: number): dateFns.Duration => {
  const days = hoursToDays(value)
  const hours = value - daysToHours(days)
  const components = formatDaysToComponents(days)
  return { ...components, hours }
}

export const formatMinutesToComponents = (value: number): dateFns.Duration => {
  const hours = dateFns.minutesToHours(value)
  const minutes = value - dateFns.hoursToMinutes(hours)
  const components = formatHoursToComponents(hours)
  return { ...components, minutes }
}

export const formatSecondsToComponents = (value: number): dateFns.Duration => {
  const minutes = dateFns.secondsToMinutes(value)
  const seconds = value - dateFns.minutesToSeconds(minutes)
  const components = formatMinutesToComponents(minutes)
  return { ...components, seconds }
}

export const formatDurationMonths = (value: number): string => {
  const components = formatMonthsToComponents(value)
  return formatDuration(components)
}

export const formatDurationDays = (value: number): string => {
  const components = formatDaysToComponents(value)
  return formatDuration(components)
}

export const formatDurationHours = (value: number): string => {
  const components = formatHoursToComponents(value)
  return formatDuration(components)
}

export const formatDurationMinutes = (value: number): string => {
  const components = formatMinutesToComponents(value)
  return formatDuration(components)
}

export const formatDurationSeconds = (value: number): string => {
  const components = formatSecondsToComponents(value)
  return formatDuration(components)
}
