import { isValidCron } from 'cron-validator'
import {
  handleMinutesToCron,
  handleHoursToCron,
  handleDaysToCron,
  handleWeeksToCron,
  createCronMonths,
  handleMonthsToCron,
  handleYearsToCron,
  handleTimeToCron,
} from './helpers'
import moment from 'moment-timezone'

const zeroHourMoment = moment('0:00', 'HH:mm')
const threeAmHourMoment = moment('3:00', 'HH:mm')
const sevenAmMoment = moment('7:00', 'HH:mm')
const fourPmHourMoment = moment('16:00', 'HH:mm')
const januaryFirstZeroHour = moment('Jan 01 0:00')

describe('#handleMinutesToCron', () => {
  it('returns null for under 1 minute', () => {
    expect(handleMinutesToCron(0)).toBe(null)
  })

  it('returns null for minutes outside of max range (ie. 70)', () => {
    expect(handleMinutesToCron(80)).toBe(null)
  })

  it('returns a valid cron for minutes within acceptable ranges', () => {
    const cron = handleMinutesToCron(30)
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0/30 * * * *')
  })
})

describe('#handleHoursToCron', () => {
  it('returns null for under 1 hour', () => {
    expect(handleHoursToCron({ hours: 0, onMinute: [0], startsOn: zeroHourMoment })).toBe(null)
  })

  it('returns null for hours outside of max range (i.e 25)', () => {
    expect(handleHoursToCron({ hours: 0, onMinute: [25], startsOn: zeroHourMoment })).toBe(null)
  })

  // Single Hour tests
  it('returns a valid cron for single hour at 0 minutes, starting at beginning of day, ', () => {
    const cron = handleHoursToCron({ hours: 1, onMinute: [0], startsOn: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0/1 * * *')
  })

  it('returns a valid cron for single hour at 30 minutes, starting at beginning of day, ', () => {
    const cron = handleHoursToCron({ hours: 1, onMinute: [30], startsOn: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('30 0/1 * * *')
  })

  // Multiple Hour tests
  it('returns a valid cron for multiple hours at 0 minutes, starting at beginning of day, ', () => {
    const cron = handleHoursToCron({ hours: 2, onMinute: [0], startsOn: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0/2 * * *')
  })

  it('returns a valid cron for multiple hours at 30 minutes, starting at beginning of day, ', () => {
    const cron = handleHoursToCron({ hours: 3, onMinute: [30], startsOn: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('30 0/3 * * *')
  })

  it('returns a valid cron for multiple hours at multiple minutes, starting at beginning of day, ', () => {
    const cron = handleHoursToCron({ hours: 3, onMinute: [1, 30, 59], startsOn: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('1,30,59 0/3 * * *')
  })

  it('returns a valid cron for multiple hours at 30 minutes, starting at 3AM, ', () => {
    const cron = handleHoursToCron({ hours: 3, onMinute: [30], startsOn: threeAmHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('30 3/3 * * *')
  })

  it('returns a valid cron for multiple hours at 30 minutes, starting at 4PM, ', () => {
    const cron = handleHoursToCron({ hours: 3, onMinute: [30], startsOn: fourPmHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('30 16/3 * * *')
  })
})

describe('#handleDaysToCron', () => {
  it('returns null for under 1 day', () => {
    expect(handleDaysToCron({ days: 0, repeatsAt: sevenAmMoment })).toBe(null)
  })

  it('returns null for days over max (i.e 32)', () => {
    expect(handleDaysToCron({ days: 32, repeatsAt: sevenAmMoment })).toBe(null)
  })

  it('returns a valid cron for single day at beginning of day', () => {
    const cron = handleDaysToCron({ days: 1, repeatsAt: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1/1 * *')
  })

  it('returns a valid cron for single day at 7AM', () => {
    const cron = handleDaysToCron({ days: 1, repeatsAt: sevenAmMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 1/1 * *')
  })

  it('returns a valid cron for single day at 4PM', () => {
    const cron = handleDaysToCron({ days: 1, repeatsAt: fourPmHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 16 1/1 * *')
  })

  it('returns a valid cron for multiple days at beginning of day', () => {
    const cron = handleDaysToCron({ days: 2, repeatsAt: zeroHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1/2 * *')
  })

  it('returns a valid cron for multiple days at 7AM', () => {
    const cron = handleDaysToCron({ days: 3, repeatsAt: sevenAmMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 1/3 * *')
  })

  it('returns a valid cron for multiple days at 4PM', () => {
    const cron = handleDaysToCron({ days: 6, repeatsAt: fourPmHourMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 16 1/6 * *')
  })
})

describe('#handleWeeksToCron', () => {
  it('returns null for empty repeatsOn (need to know what day(s) to repeat on)', () => {
    expect(handleWeeksToCron({ repeatsAt: sevenAmMoment, repeatsOn: [] })).toBe(null)
  })

  it('returns null for days outside of week range (only 0-6 is valid) - no 7!', () => {
    expect(handleWeeksToCron({ repeatsAt: sevenAmMoment, repeatsOn: [0, 1, 6, 7] })).toBe(null)
  })

  it('returns null for days outside of week range (only 0-6 is valid) - no -1!', () => {
    expect(handleWeeksToCron({ repeatsAt: sevenAmMoment, repeatsOn: [0, 1, 6, -1] })).toBe(null)
  })

  it('returns a valid cron with one day selected (first)', () => {
    const cron = handleWeeksToCron({ repeatsAt: zeroHourMoment, repeatsOn: [0] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 * * 0')
  })

  it('returns a valid cron with one day selected (last)', () => {
    const cron = handleWeeksToCron({ repeatsAt: zeroHourMoment, repeatsOn: [6] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 * * 6')
  })

  it('returns a valid cron with multiple days selected (first and last)', () => {
    const cron = handleWeeksToCron({ repeatsAt: sevenAmMoment, repeatsOn: [0, 6] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 * * 0,6')
  })

  it('returns a valid cron with all days selected', () => {
    const cron = handleWeeksToCron({ repeatsAt: sevenAmMoment, repeatsOn: [0, 1, 2, 3, 4, 5, 6] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 * * 0,1,2,3,4,5,6')
  })
})

describe('#createCronMonths', () => {
  it('returns null for starts on below acceptable range (1-12), i.e. 0', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 2, startsOn: 0 })).toBe(null)
  })

  it('returns null for starts on above acceptable range (1-12), i.e. 13', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 2, startsOn: 13 })).toBe(null)
  })

  it('returns null if numberOfMonthsRepeated below acceptable range (1-6), i.e. 0', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 0, startsOn: 6 })).toBe(null)
  })

  it('returns null if numberOfMonthsRepeated above acceptable range (1-6), i.e. 7', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 7, startsOn: 6 })).toBe(null)
  })

  it('returns [1,3,5,7,9,11] when repeated is 2, starting in January', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 2, startsOn: 1 })).toEqual(
      expect.arrayContaining([1, 3, 5, 7, 9, 11])
    )
  })

  it('returns [1,4,7,10] when repeated is 3, starting in January', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 3, startsOn: 1 })).toEqual(expect.arrayContaining([1, 4, 7, 10]))
  })

  it('returns [1,5,9] when repeated is 4, starting in January', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 4, startsOn: 1 })).toEqual(expect.arrayContaining([1, 5, 9]))
  })

  it('returns [1,6] when repeated is 5, starting in January', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 5, startsOn: 1 })).toEqual(expect.arrayContaining([1, 6]))
  })

  it('returns [1,7] when repeated is 6, starting in January', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 6, startsOn: 1 })).toEqual(expect.arrayContaining([1, 7]))
  })

  it('can continue passed December (12) and continue building cron months until numberOfMonthsRepeated satisfied, (i.e. repeated 2, startsOn: 10) === [10,12,2,4,6,8]', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 2, startsOn: 10 })).toEqual(
      expect.arrayContaining([10, 12, 2, 4, 6, 8])
    )
  })

  it('can continue passed December (12) and continue building cron months until numberOfMonthsRepeated satisfied, (i.e. repeated 3, startsOn: 10) === [10,1,4,7]', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 3, startsOn: 10 })).toEqual(expect.arrayContaining([10, 1, 4, 7]))
  })

  it('can continue passed December (12) and continue building cron months until numberOfMonthsRepeated satisfied, (i.e. repeated 4, startsOn: 10) === [10,2,6]', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 4, startsOn: 10 })).toEqual(expect.arrayContaining([10, 2, 6]))
  })

  it('can continue passed December (12) and continue building cron months until numberOfMonthsRepeated satisfied, (i.e. repeated 5, startsOn: 10) === [10,3]', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 5, startsOn: 10 })).toEqual(expect.arrayContaining([10, 3]))
  })

  it('can continue passed December (12) and continue building cron months until numberOfMonthsRepeated satisfied, (i.e. repeated 6, startsOn: 10) === [10,4]', () => {
    expect(createCronMonths({ numberOfMonthsRepeated: 6, startsOn: 10 })).toEqual(expect.arrayContaining([10, 4]))
  })
})

describe('#handleMonthsToCron', () => {
  // handleMonthsToCron({months: 0, repeatsAt, repeatsOn, startsOn})
  it('returns null for 0 months', () => {
    expect(handleMonthsToCron({ months: 0, repeatsAt: sevenAmMoment, repeatsOn: [1] })).toBe(null)
  })

  it('returns null for months below acceptable range (1-6), i.e. -1', () => {
    expect(handleMonthsToCron({ months: -1, repeatsAt: sevenAmMoment, repeatsOn: [1] })).toBe(null)
  })

  it('returns null for months above acceptable range (1-6), i.e. 7', () => {
    expect(handleMonthsToCron({ months: 7, repeatsAt: sevenAmMoment, repeatsOn: [1] })).toBe(null)
  })

  it('returns null for repeatsOn with months outside of acceptable range (1-31), i.e. [0,1,2]', () => {
    expect(handleMonthsToCron({ months: 2, repeatsAt: sevenAmMoment, repeatsOn: [0, 1, 2] })).toBe(null)
  })

  it('returns null for repeatsOn with months outside of acceptable range (1-31), i.e. [1,2, 32]', () => {
    expect(handleMonthsToCron({ months: 1, repeatsAt: sevenAmMoment, repeatsOn: [1, 2, 32] })).toBe(null)
  })

  it('returns a valid cron for single month at beginning of day and month', () => {
    const cron = handleMonthsToCron({ months: 1, repeatsAt: zeroHourMoment, repeatsOn: [1] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1 1/1 *')
  })

  it('returns a valid cron for single month at beginning of day and first and last day of the month', () => {
    const cron = handleMonthsToCron({ months: 1, repeatsAt: zeroHourMoment, repeatsOn: [1, 31] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1,31 1/1 *')
  })

  it('returns a valid cron for single month at beginning of day and multiple days of the month', () => {
    const cron = handleMonthsToCron({ months: 1, repeatsAt: zeroHourMoment, repeatsOn: [1, 5, 6, 7, 31] })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1,5,6,7,31 1/1 *')
  })

  it('returns a valid cron for multiple months (2) at beginning of day and month, starting in January', () => {
    const cron = handleMonthsToCron({ months: 2, repeatsAt: zeroHourMoment, repeatsOn: [1], startsOn: 1 })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1 1,3,5,7,9,11 *')
  })

  it('returns a valid cron for multiple months (2) at beginning of day and month, starting in December', () => {
    const cron = handleMonthsToCron({ months: 2, repeatsAt: zeroHourMoment, repeatsOn: [1], startsOn: 12 })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1 12,2,4,6,8,10 *')
  })

  it('returns a valid cron for multiple months (3) at beginning of day and month, starting in June', () => {
    const cron = handleMonthsToCron({ months: 3, repeatsAt: zeroHourMoment, repeatsOn: [1], startsOn: 6 })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1 6,9,12,3 *')
  })
})

describe('#handleYearsToCron', () => {
  it('returns a valid cron', () => {
    expect(handleYearsToCron({ repeatsAt: januaryFirstZeroHour })).toBe('0 0 1 1 *')
  })
})

// this is the constructor for all cron types (minute, hour, day, week, month, year)
describe('#handleTimeToCron', () => {
  it('returns a valid cron for minutes', () => {
    const cron = handleTimeToCron({ frequency: 30, segmentation: 'minute' })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0/30 * * * *')
  })

  it('returns a valid cron for a single hour', () => {
    const cron = handleTimeToCron({
      frequency: 1,
      segmentation: 'hour',
      minute_of_hour: [0],
      starts_on_hour: zeroHourMoment,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0/1 * * *')
  })

  it('returns a valid cron for multiple hours', () => {
    const cron = handleTimeToCron({
      frequency: 2,
      segmentation: 'hour',
      minute_of_hour: [0],
      starts_on_hour: zeroHourMoment,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0/2 * * *')
  })

  it('returns a valid cron for hours, with at minute 2', () => {
    const cron = handleTimeToCron({
      frequency: 2,
      segmentation: 'hour',
      starts_on_hour: zeroHourMoment,
      minute_of_hour: [2],
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('2 0/2 * * *')
  })

  it('returns a valid cron for single day', () => {
    const cron = handleTimeToCron({ frequency: 1, segmentation: 'day', repeats_at: sevenAmMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 1/1 * *')
  })

  it('returns a valid cron for multiple days', () => {
    const cron = handleTimeToCron({ frequency: 2, segmentation: 'day', repeats_at: sevenAmMoment })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 1/2 * *')
  })

  it('returns a valid cron for week with single day', () => {
    const cron = handleTimeToCron({
      frequency: 1,
      segmentation: 'week',
      repeats_on_week_days: [1],
      repeats_at: sevenAmMoment,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 * * 1')
  })

  it('returns a valid cron for week with multiple days', () => {
    const cron = handleTimeToCron({
      frequency: 1,
      segmentation: 'week',
      repeats_on_week_days: [1, 6],
      repeats_at: sevenAmMoment,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 * * 1,6')
  })

  it('returns a valid cron single month', () => {
    const cron = handleTimeToCron({
      frequency: 1,
      segmentation: 'month',
      repeats_on_month_days: [1],
      repeats_at: sevenAmMoment,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 1 1/1 *')
  })

  it('returns a valid cron multiple months', () => {
    const cron = handleTimeToCron({
      frequency: 2,
      segmentation: 'month',
      repeats_on_month_days: [1, 3, 7],
      repeats_at: sevenAmMoment,
      starts_on_month: 12,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 7 1,3,7 12,2,4,6,8,10 *')
  })

  it('returns a valid cron for year', () => {
    const cron = handleTimeToCron({
      frequency: 1,
      segmentation: 'year',
      repeats_at: januaryFirstZeroHour,
    })
    const isValid = isValidCron(cron || '', { seconds: false })
    expect(isValid).toBe(true)
    expect(cron).toBe('0 0 1 1 *')
  })
})
