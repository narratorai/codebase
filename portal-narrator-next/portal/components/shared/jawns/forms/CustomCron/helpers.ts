import _ from 'lodash'
import { Moment } from 'moment-timezone'
import { MAX_FREQUENCIES } from './constants'
import { CustomCronFormProps } from './interfaces'

const hourAndMinuteFromMoment = (time: Moment) => {
  const hour = time.hour()
  const minute = time.minute()

  return { hour, minute }
}

const monthAndDayFromMoment = (time: Moment) => {
  const month = time.month() + 1
  const day = time.date()

  return { month, day }
}

export const handleMinutesToCron = (minutes: number) => {
  // currently only supports 1 to 59 minutes
  if (minutes < 1 || minutes > MAX_FREQUENCIES['minute']) {
    return null
  }

  return `0/${minutes} * * * *`
}

export const handleHoursToCron = ({
  hours,
  onMinute,
  startsOn,
}: {
  hours: number
  onMinute: number[]
  startsOn: Moment
}) => {
  // currently only supports 1 to 23 hours
  if (hours < 1 || hours > MAX_FREQUENCIES['hour']) {
    return null
  }

  // don't use startsOn if only 1 hour (every hour)
  if (hours === 1) {
    return `${onMinute.join(',')} 0/${hours} * * *`
  }

  // for multiple hours, use startsOn
  const { hour: startsOnHour } = hourAndMinuteFromMoment(startsOn)

  return `${onMinute.join(',')} ${startsOnHour}/${hours} * * *`
}

export const handleDaysToCron = ({ days, repeatsAt }: { days: number; repeatsAt: Moment }) => {
  // currently only supports 1 to 31 days
  if (days < 1 || days > MAX_FREQUENCIES['day']) {
    return null
  }

  const { minute, hour } = hourAndMinuteFromMoment(repeatsAt)

  return `${minute} ${hour} 1/${days} * *`
}

export const handleWeeksToCron = ({ repeatsAt, repeatsOn }: { repeatsAt: Moment; repeatsOn: number[] }) => {
  // only accept days of the week from 0-6
  const daysOutOfRange = repeatsOn.filter((day) => day < 0 || day > 6)

  // need all valid days (and at least one)
  if (!_.isEmpty(daysOutOfRange) || _.isEmpty(repeatsOn)) {
    return null
  }

  const { minute, hour } = hourAndMinuteFromMoment(repeatsAt)

  return `${minute} ${hour} * * ${repeatsOn.join(',')}`
}

export const createCronMonths = ({
  numberOfMonthsRepeated,
  startsOn,
}: {
  numberOfMonthsRepeated: number
  startsOn: number
}): number[] | null => {
  // available months (startsOn) are 1-12
  const monthsOutOfRange = startsOn < 1 || startsOn > 12
  // available repeated is 1-6
  const repeatedOutOfRange = numberOfMonthsRepeated < 1 || numberOfMonthsRepeated > 6

  if (monthsOutOfRange || repeatedOutOfRange || !_.isFinite(startsOn)) {
    return null
  }

  // ex: if numberOfMonthsRepeated were 3 (repeat every three months)
  // we would need to return 4 months
  const numberOfMonthsToReturn = Math.floor(12 / numberOfMonthsRepeated)

  // ex: if starts on were 5 (starting in May)
  // we would return [5, 8, 11, 2]

  // start with startsOn
  const monthsToReturn = [startsOn]
  let selectedMonth = startsOn

  // and build the remaining months
  while (monthsToReturn.length < numberOfMonthsToReturn) {
    let nextSelectedMonth = selectedMonth + numberOfMonthsRepeated

    // make sure you don't go over 12 (continue counting at January)
    if (nextSelectedMonth > 12) {
      nextSelectedMonth = nextSelectedMonth - 12
    }

    selectedMonth = nextSelectedMonth
    // add the month to eventual return
    monthsToReturn.push(nextSelectedMonth)
  }

  return monthsToReturn
}

export const handleMonthsToCron = ({
  months,
  repeatsAt,
  repeatsOn,
  startsOn,
}: {
  months: number
  repeatsAt: Moment
  repeatsOn: number[]
  startsOn?: number
}) => {
  // currently only supports 1-12 months
  if (months < 1 || months > MAX_FREQUENCIES['month']) {
    return null
  }

  // only accept repeatsOn days (1-31)
  const repeatsOnOutOfRange = repeatsOn.filter((day) => day < 1 || day > 31)
  if (!_.isEmpty(repeatsOnOutOfRange)) {
    return null
  }

  const { minute, hour } = hourAndMinuteFromMoment(repeatsAt)

  // can skip startsOn logic if only 1 month
  if (months === 1) {
    return `${minute} ${hour} ${repeatsOn.join(',')} 1/${months} *`
  }

  // there was more than one month (has startsOn month)
  if (startsOn) {
    // use amount of months and startsOn to create list of months
    const repeatedMonths = createCronMonths({ numberOfMonthsRepeated: months, startsOn })

    // this shouldn't happen, but just in case
    if (!repeatedMonths) {
      return null
    }

    return `${minute} ${hour} ${repeatsOn.join(',')} ${repeatedMonths.join(',')} *`
  }

  // this really should never happen
  return null
}

export const handleYearsToCron = ({ repeatsAt }: { repeatsAt: Moment }) => {
  // can only be yearly (no multiple years)
  const { minute, hour } = hourAndMinuteFromMoment(repeatsAt)
  const { month, day } = monthAndDayFromMoment(repeatsAt)

  return `${minute} ${hour} ${day} ${month} *`
}

// this is the orchestrator for the different types of cron
// (minute, hour, day, week, month, year logic)
export const handleTimeToCron = ({
  frequency,
  segmentation,
  repeats_at,
  minute_of_hour,
  starts_on_hour,
  repeats_on_week_days,
  repeats_on_month_days,
  starts_on_month,
}: CustomCronFormProps) => {
  if (segmentation === 'minute') {
    return handleMinutesToCron(frequency)
  }

  if (segmentation === 'hour' && (!!minute_of_hour || minute_of_hour === 0) && !!starts_on_hour) {
    return handleHoursToCron({ hours: frequency, onMinute: minute_of_hour, startsOn: starts_on_hour })
  }

  if (segmentation === 'day' && !!repeats_at) {
    return handleDaysToCron({ days: frequency, repeatsAt: repeats_at })
  }

  if (segmentation === 'week' && repeats_at && repeats_on_week_days && repeats_on_week_days?.length > 0) {
    return handleWeeksToCron({ repeatsAt: repeats_at, repeatsOn: repeats_on_week_days })
  }

  if (segmentation === 'month' && repeats_at && repeats_on_month_days && repeats_on_month_days?.length > 0) {
    return handleMonthsToCron({
      months: frequency,
      repeatsAt: repeats_at,
      repeatsOn: repeats_on_month_days,
      startsOn: starts_on_month,
    })
  }

  if (segmentation === 'year' && !!repeats_at) {
    return handleYearsToCron({ repeatsAt: repeats_at })
  }

  return null
}
