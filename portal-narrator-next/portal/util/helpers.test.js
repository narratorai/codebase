import {
  abbreviate,
  commaify,
  csvValueSanitizer,
  formatShortTime,
  formatShortTimeLocal,
  formatTableTimeStamp,
  formatTimeDay,
  formatTimeDayLocal,
  formatTimeDayMonth,
  formatTimeDayMonthLocal,
  formatTimeRelative,
  formatTimeStamp,
  formatTimeStampUtc,
  getDurationFromSeconds,
  intlMoneyify,
  isMoreThanAWeekAgo,
  isPercentable,
  moneyify,
  percentify,
  timeFromNow,
  valueToSnakeCase,
} from './helpers'

// Wed Oct 04 2023 08:00:00 GMT+0000
const OctoberFourth2023Unix = 1696406400000

describe('commaify', () => {
  it('adds commas to large numbers', () => {
    expect(commaify(1234786123)).toBe('1,234,786,123')
  })

  it('preserves decimals', () => {
    expect(commaify(123478.1234)).toBe('123,478.1234')
  })

  it('handles undefined', () => {
    expect(commaify(undefined)).toBe(0)
  })
})

describe('percentify', () => {
  it('creates percent', () => {
    expect(percentify(0.456)).toBe('46%')
  })

  it('returns 0% when the value is 0', () => {
    expect(percentify(0)).toBe('0%')
  })

  it('creates percent', () => {
    expect(percentify(0.09123)).toBe('9.12%')
  })

  it('creates percent', () => {
    expect(percentify(0.000038)).toBe('0.004%')
  })

  it('creates percent', () => {
    expect(percentify(-0.000038)).toBe('-0.004%')
  })
})

describe('isPercentable', () => {
  it('returns true for strings begining with 0.', () => {
    expect(isPercentable('0.999')).toBe(true)
  })
  it('returns true for strings begining with .', () => {
    expect(isPercentable('.999')).toBe(true)
  })
  it('returns true for numbers begining with 0.', () => {
    expect(isPercentable(0.234)).toBe(true)
  })
  it('returns true for numbers begining with .', () => {
    expect(isPercentable(0.234)).toBe(true)
  })
  it('returns false for numbers not begining with 0 or decimal', () => {
    expect(isPercentable(1.234)).toBe(false)
  })
  it('returns false for strings not begining with 0 or decimal', () => {
    expect(isPercentable('1.234')).toBe(false)
  })
  it('returns false for non-numerical strings', () => {
    expect(isPercentable('testing.122')).toBe(false)
  })
  it('returns false for timestamp strings', () => {
    expect(isPercentable('2018-01-11T20:44:24.261000')).toBe(false)
  })
  it('returns false for NaN', () => {
    expect(isPercentable(NaN)).toBe(false)
  })
  it('returns false for null', () => {
    expect(isPercentable(null)).toBe(false)
  })
  it('returns false for undefined', () => {
    expect(isPercentable(undefined)).toBe(false)
  })
  it('returns false for false', () => {
    expect(isPercentable(false)).toBe(false)
  })
})

describe('moneyify', () => {
  it('converts numerical string to string with currency', () => {
    expect(moneyify('95001.01')).toBe('$95,001.01')
  })

  it('creates string with currency', () => {
    expect(moneyify(109)).toBe('$109.00')
  })

  it('converts null to 0 string with currency', () => {
    expect(moneyify(null)).toBe('$0.00')
  })
})

describe('abbreviate', () => {
  it('commaifies numbers below 10,000', () => {
    expect(abbreviate(7654)).toBe('7,654')
  })

  it('will round to 10K if it is close', () => {
    expect(abbreviate(9999)).toBe('10.0K')
  })

  it('will add a K to numbers below 1 million', () => {
    expect(abbreviate(500000)).toBe('500.0K')
  })

  it('Rounds 999,999 to 1M', () => {
    expect(abbreviate(999999)).toBe('1.0M')
  })

  it('adds a B to numbers below a trillion (and rounds the number)', () => {
    expect(abbreviate(123456789012)).toBe('123.5B')
  })

  it('adds a T to numbers in the trillion', () => {
    expect(abbreviate(566200100100100)).toBe('566.2T')
  })

  it('commafies numbers that go beyond the trillions (not terribly realistic)', () => {
    expect(abbreviate(7234100100100100)).toBe('7,234.1T')
  })
})

describe('valueToSnakeCase', () => {
  it('converts string value to snake value', () => {
    expect(valueToSnakeCase('Test This')).toBe('test_this')
  })

  it('converts negative number value to snake value', () => {
    expect(valueToSnakeCase(-10)).toBe('negative_10')
  })

  it('converts - string value to snake value', () => {
    expect(valueToSnakeCase('have a - yo')).toBe('have_a_dash_yo')
  })

  it('converts backslash string value to snake value', () => {
    expect(valueToSnakeCase('https://www.test.com/this/')).toBe('https_slash_slashwww_test_com_slashthis_slash')
  })

  it('converts null value to snake value', () => {
    expect(valueToSnakeCase(null)).toBe('null')
  })
})

describe('csvValueSanitizer', () => {
  it('returns a number when passed a number', () => {
    expect(csvValueSanitizer(5)).toBe(5)
  })

  it('returns a boolean when passed a boolean', () => {
    expect(csvValueSanitizer(true)).toBe(true)
  })

  it('returns a null when passed null', () => {
    expect(csvValueSanitizer(null)).toBe(null)
  })

  it('returns a string with no commas or double quotes', () => {
    expect(csvValueSanitizer('Howdy there')).toBe('"Howdy there"')
  })

  it('can handle a comma in a string', () => {
    expect(csvValueSanitizer('Howdy, there')).toBe('"Howdy, there"')
  })

  it('can handle a double quote in a string', () => {
    expect(csvValueSanitizer('Howdy there "partner"')).toBe('"Howdy there ""partner"""')
  })

  it('can handle a double quote and a comma in a string', () => {
    expect(csvValueSanitizer('Howdy, there "partner"')).toBe('"Howdy, there ""partner"""')
  })
})

describe('intlMoneyify', () => {
  it('formats zero correctly', () => {
    expect(intlMoneyify(0)).toBe('$0.00')
  })

  it('formats foreign currency correctlty', () => {
    expect(intlMoneyify(4321, 'JPY')).toBe('¥4,321')
  })

  it('returns null for non numeric values', () => {
    expect(intlMoneyify('asdf')).toBe(null)
  })
})

describe('formatShortTime', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2019-10-04T08:00:00-04:00'))
  })

  it('formats a time correctly', () => {
    expect(formatShortTime('2019-01-11T20:44:24.261000Z')).toBe('1/11/19 3:44pm EST')
  })

  it('formats a time correctly for double digit month', () => {
    expect(formatShortTime('2019-11-11T20:44:24.261000Z')).toBe('11/11/19 3:44pm EST')
  })

  it('formats correctly when given a timezone', () => {
    expect(formatShortTime('2019-11-11T20:44:24.261000Z', 'America/Los_Angeles')).toBe('11/11/19 12:44pm PST')
  })

  it('formats correctly when told to hide the timezone from result', () => {
    expect(formatShortTime('2019-11-11T20:44:24.261000Z', 'America/Los_Angeles', false)).toBe('11/11/19 12:44pm')
  })

  it('returns "Invalid Date" for non time values', () => {
    expect(formatShortTime('asdf')).toBe('Invalid date')
  })

  it('can take a unix time and New York timezone and correctly format it', () => {
    expect(formatShortTime(OctoberFourth2023Unix, 'America/New_York')).toBe('10/4/23 8:00am EDT')
  })

  it('can take a unix time and New York timezone and correctly format it', () => {
    expect(formatShortTime(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('10/4/23 8:00am +08')
  })

  it('can take a unix time, timezone, and hide the timezone correctly format it', () => {
    expect(formatShortTime(OctoberFourth2023Unix, 'Asia/Singapore', false)).toBe('10/4/23 8:00am')
  })
})

describe('formatShortTimeLocal', () => {
  it('takes a unix time, new york timezone, and can hide the timezone and converts the time to timezone', () => {
    expect(formatShortTimeLocal(OctoberFourth2023Unix, 'America/New_York', false)).toBe('10/4/23 4:00am')
  })

  it('takes a unix time, london timezone, and can hide the timezone and converts the time to timezone', () => {
    expect(formatShortTimeLocal(OctoberFourth2023Unix, 'Asia/Singapore', false)).toBe('10/4/23 4:00pm')
  })

  it('takes a unix time, new york timezone, and can show the timezone and converts the time to timezone', () => {
    expect(formatShortTimeLocal(OctoberFourth2023Unix, 'America/New_York')).toBe('10/4/23 4:00am EDT')
  })

  it('takes a unix time, london timezone, and can show the timezone and converts the time to timezone', () => {
    expect(formatShortTimeLocal(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('10/4/23 4:00pm +08')
  })
})

describe('formatTimeDay', () => {
  it('formats a time correctly', () => {
    expect(formatTimeDay('2019-01-11T20:44:24.261000Z')).toBe('11th 3:44pm')
  })

  it('formats a time correctly for odd ordinal numbered days', () => {
    expect(formatTimeDay('2019-11-03T20:44:24.261000Z')).toBe('3rd 3:44pm')
  })

  it('formats a time correctly when passed a timezone', () => {
    expect(formatTimeDay('2019-11-03T20:44:24.261000Z', 'America/Los_Angeles')).toBe('3rd 12:44pm')
  })

  it('returns "Invalid Date" for non time values', () => {
    expect(formatTimeDay('asdf')).toBe('Invalid date')
  })

  it('formats unix time correctly', () => {
    expect(formatTimeDay(OctoberFourth2023Unix)).toBe('4th 8:00am')
  })
})

describe('formatTimeDayLocal', () => {
  it('takes unix time and a new york timezone and formats correctly', () => {
    expect(formatTimeDayLocal(OctoberFourth2023Unix, 'America/New_York')).toBe('4th 4:00am')
  })

  it('takes unix time and a london timezone and formats correctly', () => {
    expect(formatTimeDayLocal(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('4th 4:00pm')
  })
})

describe('formatTimeDayMonth', () => {
  it('formats a time correctly', () => {
    expect(formatTimeDayMonth('2019-01-11T20:44:24.261000Z')).toBe('1/11 3:44pm')
  })

  it('formats a time correctly for double digit month', () => {
    expect(formatTimeDayMonth('2019-11-03T20:44:24.261000Z')).toBe('11/3 3:44pm')
  })

  it('formats a time correctly when passed a timezone', () => {
    expect(formatTimeDayMonth('2019-11-03T20:44:24.261000Z', 'America/Los_Angeles')).toBe('11/3 12:44pm')
  })

  it('returns "Invalid Date" for non time values', () => {
    expect(formatTimeDayMonth('asdf')).toBe('Invalid date')
  })

  it('formats unix time correctly', () => {
    expect(formatTimeDayMonth(OctoberFourth2023Unix)).toBe('10/4 8:00am')
  })
})

describe('formatTimeDayMonthLocal', () => {
  it('takes unix time and a new york timezone and formats correctly', () => {
    expect(formatTimeDayMonthLocal(OctoberFourth2023Unix, 'America/New_York')).toBe('10/4 4:00am')
  })

  it('takes unix time and a london timezone and formats correctly', () => {
    expect(formatTimeDayMonthLocal(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('10/4 4:00pm')
  })
})

describe('timeFromNow', () => {
  it('can take a timestring and return time from now', () => {
    const now = new Date('2019-10-04T08:00:00-04:00')
    const weekAgo = now - 604800000
    const date = new Date(weekAgo)
    const formattedWeekAgo = date.toISOString()
    expect(timeFromNow(formattedWeekAgo)).toBe('7 days ago')
  })

  it('can take a timestring and return time from now with a timezone applied - New York', () => {
    const now = Date.now()
    const sixHoursAgo = now - 21600000
    const date = new Date(sixHoursAgo)
    const formattedWeekAgo = date.toISOString().slice(0, -1) // remove Z to make none utc
    expect(timeFromNow(formattedWeekAgo, 'America/New_York')).toBe('2 hours ago')
  })

  it('can take a timestring and return time from now with a timezone applied - London', () => {
    const now = Date.now()
    const fiveHoursAgo = now - 18000000
    const date = new Date(fiveHoursAgo)
    const formattedFiveHoursAgo = date.toISOString().slice(0, -1) // remove Z to make none utc
    expect(timeFromNow(formattedFiveHoursAgo, 'Asia/Singapore')).toBe('13 hours ago')
  })

  it('can take a Unix time and return time from now', () => {
    const now = Date.now()
    const weekAgo = now - 604800000
    expect(timeFromNow(weekAgo)).toBe('7 days ago')
  })
})

describe('formatTimeStamp', () => {
  it('can take a non-utc timestamp and return the correct format', () => {
    expect(formatTimeStamp('2023-09-03T20:44:24.261000')).toBe('Sep 3rd 2023, 8:44pm EDT')
  })

  it('can take a non-utc timestamp and a timezone and return the correct format', () => {
    expect(formatTimeStamp('2023-09-03T20:44:24.261000', 'Asia/Singapore')).toBe('Sep 3rd 2023, 8:44pm +08')
  })

  it('can take a utc timestamp and return the correct format', () => {
    expect(formatTimeStamp('2023-09-03T20:44:24.261000Z')).toBe('Sep 3rd 2023, 4:44pm EDT')
  })

  it('can take a utc timestamp and a timezone and return the correct format', () => {
    expect(formatTimeStamp('2023-09-03T20:44:24.261000Z', 'Asia/Singapore')).toBe('Sep 4th 2023, 4:44am +08')
  })

  it('can take a unix timestamp and return the correct format', () => {
    expect(formatTimeStamp(OctoberFourth2023Unix)).toBe('Oct 4th 2023, 8:00am EDT')
  })

  it('can take a unix timestamp and a timezone and return the correct format', () => {
    expect(formatTimeStamp(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('Oct 4th 2023, 8:00am +08')
  })

  it('can take a unix timestamp, timezone, and a format and return the correct format', () => {
    expect(formatTimeStamp(OctoberFourth2023Unix, 'Asia/Singapore', 'MMM Do YYYY')).toBe('Oct 4th 2023')
  })
})

describe('formatTableTimeStamp', () => {
  it('can take a utc timestamp and timezone and return the correct format', () => {
    expect(formatTableTimeStamp('2023-09-03T20:44:24.261000Z', 'Asia/Singapore')).toBe('2023-09-04 04:44am +08')
  })

  it('can take a non-utc timestamp and timezone and return the correct format', () => {
    expect(formatTableTimeStamp('2023-09-03T20:44:24.261000', 'Asia/Singapore')).toBe('2023-09-03 08:44pm +08')
  })

  it('can take a unix timestamp and timezone and return the correct format', () => {
    expect(formatTableTimeStamp(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('2023-10-04 08:00am +08')
  })

  it('can take a unix timestamp and timezone and return the correct format', () => {
    expect(formatTableTimeStamp(OctoberFourth2023Unix, 'America/New_York')).toBe('2023-10-04 08:00am EDT')
  })
})

describe('formatTimeRelative', () => {
  it('formats a time correctly', () => {
    const agoTime = timeFromNow('2019-01-11T20:44:24.261000Z')

    expect(formatTimeRelative('2019-01-11T20:44:24.261000Z')).toBe(`1/11/19 3:44pm (${agoTime})`)
  })

  it('formats a time correctly for a more recent time', () => {
    const agoTime = timeFromNow('2023-09-03T20:44:24.261000')

    expect(formatTimeRelative('2023-09-03T20:44:24.261000Z')).toBe(`9/3/23 4:44pm (${agoTime})`)
  })

  it('returns "Invalid Date" for non time values', () => {
    expect(formatTimeRelative('asdf')).toBe('Invalid date')
  })
})

describe('getDurationFromSeconds', () => {
  it('returns null for non numerical inputs', () => {
    expect(getDurationFromSeconds('asdf')).toBe(null)
    expect(getDurationFromSeconds('0')).toBe(null)
  })

  it('returns singular second format', () => {
    expect(getDurationFromSeconds(1)).toBe('1 second')
  })

  it('returns just seconds if seconds is below 60', () => {
    expect(getDurationFromSeconds(59)).toBe('59 seconds')
  })

  it('returns minutes and seconds if a minute or more and under an hour', () => {
    expect(getDurationFromSeconds(60)).toBe('1 minute')
    expect(getDurationFromSeconds(61)).toBe('1 minute and 1 second')
    expect(getDurationFromSeconds(119)).toBe('1 minute and 59 seconds')
  })

  it('returns hours, minutes, and seconds if an hour or more and under a day', () => {
    expect(getDurationFromSeconds(3600)).toBe('1 hour')
    expect(getDurationFromSeconds(3601)).toBe('1 hour and 1 second')
    expect(getDurationFromSeconds(3661)).toBe('1 hour and 1 minute and 1 second')
    expect(getDurationFromSeconds(7199)).toBe('1 hour and 59 minutes and 59 seconds')
    expect(getDurationFromSeconds(10199)).toBe('2 hours and 49 minutes and 59 seconds')
  })

  it('returns days and hours if a day or more and under a month', () => {
    expect(getDurationFromSeconds(86400)).toBe('1 day')
    expect(getDurationFromSeconds(86401)).toBe('1 day')
    expect(getDurationFromSeconds(90061)).toBe('1 day and 1 hour')
    expect(getDurationFromSeconds(172799)).toBe('1 day and 23 hours')
    expect(getDurationFromSeconds(259199)).toBe('2 days and 23 hours')
  })

  it('returns months and days if a month or more and under a year', () => {
    expect(getDurationFromSeconds(3002000)).toBe('1 month and 3 days')
    expect(getDurationFromSeconds(5184000)).toBe('1 month and 29 days')
    expect(getDurationFromSeconds(5270400)).toBe('2 months')
    expect(getDurationFromSeconds(5500400)).toBe('2 months and 2 days')
  })

  it('returns years and months if a year or more', () => {
    expect(getDurationFromSeconds(32036000)).toBe('1 year')
    expect(getDurationFromSeconds(35536000)).toBe('1 year and 1 month')

    expect(getDurationFromSeconds(63572000)).toBe('2 years')
    expect(getDurationFromSeconds(94694400)).toBe('3 years')
    expect(getDurationFromSeconds(94694400 + 31536000)).toBe('4 years')
  })
})

describe('formatTimeStampUtc', () => {
  it('can take a timestamp, new york timezone, and format to utc', () => {
    expect(formatTimeStampUtc('2023-09-03T20:44:24.261000', 'America/New_York')).toBe('Sep 3rd 2023, 4:44pm EDT')
  })

  it('can take a timestamp, london timezone, and format to utc', () => {
    expect(formatTimeStampUtc('2023-09-03T20:44:24.261000', 'Asia/Singapore')).toBe('Sep 4th 2023, 4:44am +08')
  })

  it('can take a unix timestamp, new york timezone, and format to utc', () => {
    expect(formatTimeStampUtc(OctoberFourth2023Unix, 'America/New_York')).toBe('Oct 4th 2023, 8:00am EDT')
  })

  it('can take a unix timestamp, london timezone, and format to utc', () => {
    expect(formatTimeStampUtc(OctoberFourth2023Unix, 'Asia/Singapore')).toBe('Oct 4th 2023, 8:00am +08')
  })

  it('can take a unix timestamp, denver, and format to utc', () => {
    expect(formatTimeStampUtc(OctoberFourth2023Unix, 'America/Denver')).toBe('Oct 4th 2023, 8:00am MDT')
  })
})

describe('isMoreThanAWeekAgo', () => {
  const now = new Date('2019-10-04T08:00:00-04:00')
  const eightDaysAgoUnix = now - 691200000
  const eightDaysAgoDate = new Date(eightDaysAgoUnix).toISOString()
  const sixDaysAgoUnix = now - 518400000
  const sixDaysAgoDate = new Date(sixDaysAgoUnix).toISOString()

  it('can take a timestamp and return true for more than a week', () => {
    expect(isMoreThanAWeekAgo(eightDaysAgoDate)).toBe(true)
  })

  it('can take a timestamp and return false for less than a week', () => {
    expect(isMoreThanAWeekAgo(sixDaysAgoDate)).toBe(false)
  })

  it('can take unix time and return true for more than a week', () => {
    expect(isMoreThanAWeekAgo(eightDaysAgoUnix)).toBe(true)
  })

  it('can take unix time and return false for less than a week', () => {
    expect(isMoreThanAWeekAgo(sixDaysAgoUnix)).toBe(false)
  })
})
