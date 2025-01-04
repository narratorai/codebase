import { useCallback } from 'react'
import moment from 'moment-timezone'
import { useApolloClient } from '@apollo/client'
import cronParser from 'cron-parser'
import {
  isString,
  isNumber,
  isInteger,
  isFinite,
  includes,
  toNumber,
  toInteger,
  toString,
  snakeCase,
  replace,
  isEmpty,
  trim,
} from 'lodash'
import { SECONDS_IN_MINUTE, SECONDS_IN_HOUR, SECONDS_IN_DAY } from 'util/constants'
import { reportError } from './errors'
import pluralize from 'pluralize'

export const percentify = (num) => {
  const percent = num * 100
  let precision = 2
  if (num === 0) {
    precision = 0
  } else if (Math.abs(percent) < 0.01) {
    precision = 3
  } else if (percent >= 10) {
    precision = 0
  }

  return `${percent.toFixed(precision)}%`
}
export const decimalify = (num) => {
  if (!num || !isNumber(num)) {
    return 0
  }

  if (isInteger(num)) {
    return num
  }

  return num.toFixed(2)
}

export const isPercentable = (value) => {
  // check that there is a value
  if (!value) return false
  // make sure it's a number (isFinite doesn't count NaN)
  if (!isFinite(toNumber(value))) return false
  // make sure it has a decimal in it
  if (!includes(toString(value), '.')) return false
  // make sure it starts with a 0 or a decimal ()
  if (toString(value)[0] === '0' || toString(value)[0] === '.') {
    return true
  }
  // didn't meet the criteria... NO PERCENT!
  return false
}

// When we need to do snake casing, but want to preserve - and /
export const valueToSnakeCase = (value) => {
  // replace - with "negative" for numbers only
  if (isNumber(value)) {
    return snakeCase(replace(toString(value), /-/g, 'negative '))
  }

  // set empty values to "null"
  const handleNullValue = toString(value) || 'null'

  // replace - with "dash"
  // replace / with "slash"
  return snakeCase(replace(replace(handleNullValue, /\//g, ' slash'), /-/g, 'dash '))
}

const ONE_THOUSAND = 1000
const TEN_THOUSAND = 10000
const ONE_MILLION = Math.pow(1000, 2)
const ONE_BILLION = Math.pow(1000, 3)
const ONE_TRILLION = Math.pow(1000, 4)

const divideRoundAndCommafy = (num, divisor, suffix) => {
  return `${commaify((num / divisor).toFixed(1))}${suffix}`
}

const afterRoundingNumberIsBelow = (num, divisor) => {
  return (num / divisor).toFixed(1) < 1
}

export const abbreviate = (num) => {
  if (afterRoundingNumberIsBelow(num, TEN_THOUSAND)) {
    return commaify(num)
  }
  if (afterRoundingNumberIsBelow(num, ONE_MILLION)) {
    return divideRoundAndCommafy(num, ONE_THOUSAND, 'K')
  }
  if (afterRoundingNumberIsBelow(num, ONE_BILLION)) {
    return divideRoundAndCommafy(num, ONE_MILLION, 'M')
  }
  if (afterRoundingNumberIsBelow(num, ONE_TRILLION)) {
    return divideRoundAndCommafy(num, ONE_BILLION, 'B')
  }
  return divideRoundAndCommafy(num, ONE_TRILLION, 'T')
}

export const commaify = (num) => {
  if (!num) {
    return 0
  }

  let string = num.toString()
  if (Math.abs(num) < 1000) {
    return string
  }

  var parts = string.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export const intlMoneyify = (amount, currency = 'usd') => {
  if (isFinite(amount)) {
    const decimalAmount = currency === 'usd' ? amount / 100 : amount
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(decimalAmount)
  }

  return null
}

export const moneyify = (num) => {
  if (!num) {
    return '$0.00'
  }

  return '$' + commaify(toNumber(num).toFixed(2))
}

export const timeFromNow = (timeString, tz = 'UTC') => {
  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.tz(timeString, tz).fromNow()
  }

  // epoch time is already transformed to local time
  return moment(timeString).fromNow()
}

// LOCAL: epoch time is always in utc and needs to be converted into local (company or user's timezone)
export const timeFromNowLocal = (timeString, tz = 'UTC') => {
  return moment.tz(timeString, tz).fromNow()
}

// Expects "2020-07-03T04:00:00.000Z"
export const isValidIsoString = (isoString) => {
  const validIsoRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/
  return validIsoRegex.test(isoString)
}

// i.e. America/New_York -> EDT
export const timezoneAbbreviation = (timezone) => {
  return moment.tz(timezone).zoneAbbr()
}

// https://stackoverflow.com/a/37512371/7949930
// gets the timezone of the user's browser i.e "America/New_York"
export const getLocalTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const formatUnixTimestampUtc = (timestamp) => moment(timestamp).toISOString()

export const formatIncludesTimezone = (formatString) => formatString?.at(-1) === 'z' || formatString?.at(-1) === 'Z'

// Useful for unix time, which we treat as local to the company's time
// takes something like 'MMM Do YYYY, h:mma z' and return 'MMM Do YYYY, h:mma'
// we can then add our own timezone to the end
export const stripTimezoneFormatting = (formatString) => {
  let updatedFormatString = formatString
  if (formatIncludesTimezone(updatedFormatString)) {
    updatedFormatString = updatedFormatString.slice(0, -1)
  }

  if (updatedFormatString.at(-1) === ' ') {
    updatedFormatString = updatedFormatString.slice(0, -1)
  }

  return updatedFormatString
}

// All unix time is sent as local time (local to the company's time)
// This function will strip z/Z from formatting and add the company's timezone to the end
// IF no z/Z is found, it will just return the formatted time
export const cleanLocalTime = (unixTime, tz = 'America/New_York', formatString = 'MMM Do YYYY, h:mma z') => {
  // z/Z was found in format string
  if (formatIncludesTimezone(formatString)) {
    const formatWithoutTimezone = stripTimezoneFormatting(formatString)
    // https://momentjs.com/docs/#/parsing/utc/
    // add .utc() b/c: "By default, moment parses and displays in local time."
    // since Mavis is passing unix time as company time (hack)
    // don't let moment convert it to local time
    const timeWithoutTimezone = moment(unixTime).utc().format(formatWithoutTimezone)
    const timezone = timezoneAbbreviation(tz)

    return `${timeWithoutTimezone} ${timezone}`
  }

  // no z/Z was found in format string
  return moment(unixTime).utc().format(formatString)
}

export const formatTimeStamp = (timeString, tz = 'America/New_York', formatString = 'MMM Do YYYY, h:mma z') => {
  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.tz(timeString, tz).format(formatString)
  }

  // epoch time is already transformed to local time
  return cleanLocalTime(timeString, tz, formatString)
}

// example: 2019-08-09 03:35pm EDT
export const formatTableTimeStamp = (timeString, tz = 'America/New_York') => {
  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.tz(timeString, tz).format('YYYY-MM-DD hh:mma z')
  }

  // epoch time is already transformed to local time
  // strip timezone and create custom format
  return cleanLocalTime(timeString, tz, 'YYYY-MM-DD hh:mma z')
}

// example 9/23/23 4:34pm
export const formatShortTime = (timeString, tz = 'America/New_York', withTimezone = true) => {
  const formatString = `M/D/YY h:mma${withTimezone ? ' z' : ''}`

  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.tz(timeString, tz).format(formatString)
  }

  // epoch time is already transformed to local time
  return cleanLocalTime(timeString, tz, formatString)
}

// LOCAL: epoch time is always in utc and needs to be converted into local (company or user's timezone)
export const formatShortTimeLocal = (unixTime, tz = 'America/New_York', withTimezone = true) => {
  return moment.tz(unixTime, tz).format(`M/D/YY h:mma${withTimezone ? ' z' : ''}`)
}

// example 4th 4:34pm
export const formatTimeDay = (timeString, tz = 'America/New_York') => {
  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.tz(timeString, tz).format('Do h:mma')
  }

  // epoch time is already transformed to local time
  return moment(timeString).utc().format('Do h:mma')
}

// LOCAL: epoch time is always in utc and needs to be converted into local (company vs user)
export const formatTimeDayLocal = (unixTime, tz = 'America/New_York') => moment.tz(unixTime, tz).format('Do h:mma')

// example 9/4 4:34pm
export const formatTimeDayMonth = (timeString, tz = 'America/New_York') => {
  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.tz(timeString, tz).format('M/D h:mma')
  }

  // epoch time is already transformed to local time
  return moment(timeString).utc().format('M/D h:mma')
}

// LOCAL: epoch time is always in utc and needs to be converted into local (company vs user)
// example 9/4 4:34pm
export const formatTimeDayMonthLocal = (unixTime, tz = 'America/New_York') =>
  moment.tz(unixTime, tz).format('M/D h:mma')

// example 9/23/23 4:50pm (30 mins ago)
export const formatTimeRelative = (timeString, tz = 'America/New_York') => {
  const formattedTime = formatShortTime(timeString, tz, false)

  // return early for Invalid date so it doesn't show
  // "Invalid date (Invalid date)"
  if (formattedTime === 'Invalid date') {
    return formattedTime
  }

  const timeAgo = timeFromNow(timeString, tz)

  return `${formattedTime} (${timeAgo})`
}

// LOCAL: epoch time is always in utc and needs to be converted into local (company vs user)
// example 9/23/23 4:50pm (30 mins ago)
export const formatTimeRelativeLocal = (timeString, tz = 'America/New_York') => {
  const formattedTime = formatShortTimeLocal(timeString, tz, false)

  // return early for Invalid date so it doesn't show
  // "Invalid date (Invalid date)"
  if (formattedTime === 'Invalid date') {
    return formattedTime
  }

  const timeAgo = timeFromNowLocal(timeString, tz)

  return `${formattedTime} (${timeAgo})`
}

export const formatTimeStampUtc = (timeString, tz = 'America/New_York', format = 'MMM Do YYYY, h:mma z') => {
  // only apply timezone for string timestamps
  if (isString(timeString)) {
    return moment.utc(timeString).tz(tz).format(format)
  }

  // epoch time is already transformed to local time
  return cleanLocalTime(timeString, tz, format)
}

// ex: September 1st, 2018
export const timeStampDate = (timeString) => moment(timeString).format('MMMM Do, YYYY')

// ex: 1/29/2016
export const shortDate = (dateString) => moment(dateString).format('L')

export const nDaysAgo = (n) => moment.utc().startOf('day').subtract(n, 'days')

// segmentation has to be plural ("months, days, seconds"...)
// https://momentjscom.readthedocs.io/en/latest/moment/03-manipulating/02-subtract/
export const nTimeAgo = (n, segmentation) => moment.utc().subtract(n, segmentation)

export const isMoreThanAWeekAgo = (timestring, tz = 'America/New_York') => {
  const oneWeekAgo = moment().subtract(7, 'days')
  // only apply timezone for string timestamps
  if (isString(timestring)) {
    return moment.tz(timestring, tz).isBefore(oneWeekAgo)
  }

  // epoch time is already transformed to local time
  return moment(timestring).isBefore(oneWeekAgo)
}

export const minutesToHours = (num) => num / 60
export const minutesToDays = (num) => num / (60 * 24)

export const minutesDivider = (metric) => {
  let timeMetric = metric
  let label = 'minutes'
  if (timeMetric && timeMetric > 60) {
    timeMetric = timeMetric / 60
    label = 'hours'
  }
  if (timeMetric && timeMetric > 24 && label === 'hours') {
    timeMetric = timeMetric / 24
    label = 'days'
  }
  return { timeMetric, label }
}

export const minutesFormatter = (metric, rounded = false) => {
  const { timeMetric, label } = minutesDivider(metric)

  if (rounded) {
    const roundNumber = Math.round(timeMetric)
    // re-evaluate plurized label since timeMetric could have gone from 1.23 minutes => 1 minutes
    const pluralizedLabel = pluralize(label, roundNumber)
    return commaify(decimalify(Math.round(timeMetric))) + ` ${pluralizedLabel}`
  }

  return commaify(decimalify(timeMetric)) + ` ${label}`
}

export const secondsDivider = (seconds) => {
  let timeMetric = seconds
  let label = 'seconds'
  if (seconds > SECONDS_IN_MINUTE) {
    label = 'minutes'
    timeMetric = timeMetric / 60
  }
  if (seconds > SECONDS_IN_HOUR) {
    label = 'hours'
    timeMetric = timeMetric / 60
  }
  if (seconds > SECONDS_IN_DAY) {
    label = 'days'
    timeMetric = timeMetric / 24
  }

  return { timeMetric, label }
}

export const getDurationFromSeconds = (seconds) => {
  // if seconds is not a number, return null
  if (!isFinite(seconds)) {
    return null
  }

  // if seconds is 0, return "0 seconds"
  if (seconds === 0) {
    return '0 seconds'
  }

  const time = {
    years: Math.round(moment.duration(seconds, 'seconds').years()),
    months: Math.round(moment.duration(seconds, 'seconds').months()),
    days: Math.round(moment.duration(seconds, 'seconds').days()),
    hours: Math.round(moment.duration(seconds, 'seconds').hours()),
    minutes: Math.round(moment.duration(seconds, 'seconds').minutes()),
    seconds: Math.round(moment.duration(seconds, 'seconds').seconds()),
  }

  const plurizedYear = pluralize('year', time.years)
  const plurizedMonth = pluralize('month', time.months)
  const plurizedDay = pluralize('day', time.days)
  const plurizedHour = pluralize('hour', time.hours)
  const plurizedMinute = pluralize('minute', time.minutes)
  const plurizedSecond = pluralize('second', time.seconds)

  // handle year, month value
  if (time.years > 0) {
    let formattedTime = `${commaify(time.years)} ${plurizedYear}`
    if (time.months > 0) {
      formattedTime = formattedTime.concat(` and ${time.months} ${plurizedMonth}`)
    }
    return formattedTime
  }

  // handle month, day value
  if (time.months > 0) {
    let formattedTime = `${time.months} ${plurizedMonth}`
    if (time.days > 0) {
      formattedTime = formattedTime.concat(` and ${time.days} ${plurizedDay}`)
    }

    return formattedTime
  }

  // handle day, hour value
  if (time.days > 0) {
    let formattedTime = `${time.days} ${plurizedDay}`
    if (time.hours > 0) {
      formattedTime = formattedTime.concat(` and ${time.hours} ${plurizedHour}`)
    }

    return formattedTime
  }

  // handle hour, minute, seconds value
  if (time.hours > 0) {
    let formattedTime = `${time.hours} ${plurizedHour}`
    if (time.minutes > 0) {
      formattedTime = formattedTime.concat(` and ${time.minutes} ${plurizedMinute}`)
    }
    if (time.seconds > 0) {
      formattedTime = formattedTime.concat(` and ${time.seconds} ${plurizedSecond}`)
    }

    return formattedTime
  }

  // handle minutes, seconds value
  if (time.minutes > 0) {
    let formattedTime = `${time.minutes} ${plurizedMinute}`
    if (time.seconds > 0) {
      formattedTime = formattedTime.concat(` and ${time.seconds} ${plurizedSecond}`)
    }
    return formattedTime
  }

  // handle seconds value
  if (time.seconds > 0) {
    return time.seconds + ` ${plurizedSecond}`
  }

  // shouldn't reach here but if it does, return null
  return null
}

export const secondsFormatter = (seconds) => {
  const { timeMetric, label } = secondsDivider(seconds)
  return commaify(decimalify(timeMetric)) + ` ${label}`
}

export const getDuration = ({ startTime, endTime }) => moment.duration(moment(endTime).diff(moment(startTime)))

export const getFormattedTimeDiff = ({ startTime, endTime }) => {
  const duration = getDuration({ startTime, endTime })
  const durationInSeconds = duration.asSeconds()
  return secondsFormatter(durationInSeconds)
}

export const handleApproximateCron = (crontab, task_created_at) => {
  let approximate = false
  const cronParts = crontab.split(' ')

  if (cronParts[0] === '?') {
    cronParts[0] = task_created_at ? moment.utc(task_created_at).minute().toString() : '1'
    approximate = !task_created_at
    crontab = cronParts.join(' ')
  }

  return { formattedCronTab: crontab, approximate }
}

export const nextTimeFromCron = (crontab, tz = 'America/New_York', task_created_at) => {
  // NOTE we support ? in cron minutes in order to keep task schedules distributed.
  // Mavis handles these by using a task's created_at minute
  // - if ? in minute and no task_created_at, replace with 1, add 'around' before next run string
  // - if ? in minute and task_created_at, replace with created_at minute and do not add 'around'

  try {
    const { formattedCronTab, approximate } = handleApproximateCron(crontab, task_created_at)

    // force all crons to be calculated by company timezone
    const interval = cronParser.parseExpression(formattedCronTab, { tz })

    // convert from UTC to company's local timezone:
    return (approximate ? '~ ' : '') + timeFromNow(interval.next().toISOString()).toLowerCase()
  } catch (err) {
    reportError(new Error(`Unable to parse cron expression`), null, {
      crontab,
      tz,
      cronParserError: err.message,
    })
    return `Unknown`
  }
}

// https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
// convert 1 to "1st"
export const ordinalSuffixOf = (i) => {
  const integer = toInteger(i)
  const j = integer % 10,
    k = integer % 100
  if (j === 1 && k !== 11) {
    return commaify(integer) + 'st'
  }
  if (j === 2 && k !== 12) {
    return commaify(integer) + 'nd'
  }
  if (j === 3 && k !== 13) {
    return commaify(integer) + 'rd'
  }
  return commaify(integer) + 'th'
}

// This is like 'useLazyQuery',
// but serves as a wrapper to allow the callback to have a returned result
// https://github.com/apollographql/react-apollo/issues/3499#issuecomment-586039082
export const useImperativeQuery = (query) => {
  const client = useApolloClient()

  return useCallback(
    async (variables, fetchPolicy = 'cache-first') => {
      // FIXME!
      // The issue is client.query gets from cache by default (default is "cache-first")
      // I want it to do the equivalent of refetch but don't know how to do that
      // without overriding fetchPolicy
      return client.query({ query, variables, fetchPolicy })
    },
    [query, client]
  )
}

export const userDisplayName = (firstName, lastName, email) => {
  return firstName || lastName ? `${firstName || ''} ${lastName || ''}` : email || 'Narrator'
}

export const userNameIfExists = (companyUser) => {
  const { first_name: firstName, last_name: lastName } = companyUser

  // if there is a first and/or last name
  if (!isEmpty(firstName || !isEmpty(lastName))) {
    return trim(`${firstName || ''} ${lastName || ''}`)
  }

  // there is no first or last name so return null
  return null
}

export const initialsFromString = (str = '') => {
  const matches = /\s/g.test(str) ? str.match(/(\b\w)/g) : str.match(/\w/)
  return matches?.join('')
}

export const getBadgeColor = (timeString, asDataset = false) => {
  const momentTime = moment.tz(timeString, 'UTC')
  const aWeekAgo = moment().subtract(7, 'days')
  const aMonthAgo = moment().subtract(30, 'days')

  if (momentTime.isAfter(aWeekAgo)) {
    return 'success'
  }

  if (momentTime.isBefore(aWeekAgo) && momentTime.isAfter(aMonthAgo)) {
    return 'warning'
  }

  if (asDataset) {
    return 'default'
  }

  return 'error'
}

export const withinDayAgo = (timeString) => {
  const momentTime = moment.tz(timeString, 'UTC')
  const aDayAgo = moment.utc().subtract(1, 'days')

  return momentTime.isAfter(aDayAgo)
}

export const withinWeekAgo = (timeString) => {
  const momentTime = moment.tz(timeString, 'UTC')
  const aWeekAgo = moment.utc().subtract(7, 'days')

  return momentTime.isAfter(aWeekAgo)
}

export const withinMonthAgo = (timeString) => {
  const momentTime = moment.tz(timeString, 'UTC')
  const aMonthAgo = moment.utc().subtract(30, 'days')

  return momentTime.isAfter(aMonthAgo)
}

export const removeHtmlFromString = (string) => replace(string, /<\/?[^>]+(>|$)/g, '')

// useful for matching select options w/o case sensitivity
export const caseInsensitiveFilterOption = ({ input, option }) => {
  if (typeof option?.label === 'string') {
    return (
      option?.value?.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
      option?.label?.toLowerCase().indexOf(input.toLowerCase()) >= 0
    )
  }

  return option?.value?.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// escape commas and double quotes in csv string values
export const csvValueSanitizer = (value) => {
  // if it's not a string - don't try to escape
  if (!isString(value)) {
    return value
  }

  // it is a string
  // handle double quotes
  const stringWithDoubleQuotes = value.replace(/"/g, '""')

  // surround entire string in double quotes to escape commas
  return `"${stringWithDoubleQuotes}"`
}

// returns number of segmentation (i.e. 15)
// this would represent 15 minutes ago if segmentation is 'minutes'
export const numberOfTimeAgo = (timeString, segmentation = 'minutes') => {
  const now = moment.utc()
  const end = moment.utc(timeString)
  return now.diff(end, segmentation)
}
