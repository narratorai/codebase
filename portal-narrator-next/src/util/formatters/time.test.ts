import {
  formatDate,
  formatDateTime,
  formatDistance,
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

describe('formatDate', () => {
  it('should return date (e.g., "May 16, 2024")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = 'May 16, 2024'
    const result = formatDate(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatDateTime', () => {
  it('should return date and time (e.g., "May 16, 2024, 3:30 PM UTC")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = 'May 16, 2024, 3:30 PM UTC'
    const result = formatDateTime(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatDistance', () => {
  it('should return distance (e.g., "in less than 5 seconds")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const baseValue = '2024-05-16T15:30:43.678-00:00'
    const expected = 'in less than 5 seconds'
    const result = formatDistance(value, baseValue, options)
    expect(result).toBe(expected)
  })

  it('should return distance (e.g., "in less than 10 seconds")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const baseValue = '2024-05-16T15:30:39.678-00:00'
    const expected = 'in less than 10 seconds'
    const result = formatDistance(value, baseValue, options)
    expect(result).toBe(expected)
  })

  it('should return distance (e.g., "in less than 20 seconds")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const baseValue = '2024-05-16T15:30:30.678-00:00'
    const expected = 'in less than 20 seconds'
    const result = formatDistance(value, baseValue, options)
    expect(result).toBe(expected)
  })

  it('should return distance (e.g., "in less than a minute")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const baseValue = '2024-05-16T15:30:00.678-00:00'
    const expected = 'in less than a minute'
    const result = formatDistance(value, baseValue, options)
    expect(result).toBe(expected)
  })

  it('should return distance (e.g., "in 6 minutes")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const baseValue = '2024-05-16T15:25:00.678-00:00'
    const expected = 'in 6 minutes'
    const result = formatDistance(value, baseValue, options)
    expect(result).toBe(expected)
  })

  it('should return distance (e.g., "10 minutes ago")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const baseValue = '2024-05-16T15:40:45.678-00:00'
    const expected = '10 minutes ago'
    const result = formatDistance(value, baseValue, options)
    expect(result).toBe(expected)
  })
})

describe('formatDistanceToNow', () => {
  it('should return time distance to now (e.g., "3 days ago")', () => {
    const options = { locale: 'en-US' }
    const date = Date.now() - 1000 * 60 * 60 * 24 * 3
    const value = new Date(date).toISOString()
    const expected = '3 days ago'
    const result = formatDistanceToNow(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatDurationDays', () => {
  it('should return days (e.g., "1 day")', () => {
    const value = 1
    const expected = '1 day'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return days (e.g., "15 days")', () => {
    const value = 15
    const expected = '15 days'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return months and days (e.g., "1 month, 2 days")', () => {
    const value = 32
    const expected = '1 month, 2 days'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return months and days (e.g., "1 month, 30 days")', () => {
    const value = 60
    const expected = '1 month, 30 days'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return months and days (e.g., "2 months, 11 days")', () => {
    const value = 72
    const expected = '2 months, 11 days'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return years, months, and days (e.g., "1 year, 2 months, 4 days")', () => {
    const value = 430
    const expected = '1 year, 2 months, 4 days'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return years, months, and days (e.g., "2 years, 2 months, 9 days")', () => {
    const value = 800
    const expected = '2 years, 2 months, 9 days'
    const result = formatDurationDays(value)
    expect(result).toBe(expected)
  })

  it('should return years, months, days, and hours (e.g., "2 years, 3 months, 16 days, 23 hours")', () => {
    const value = 20135
    const expected = '2 years, 3 months, 16 days, 23 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })
})

describe('formatDurationHours', () => {
  it('should return hours (e.g., "1 hour")', () => {
    const value = 1
    const expected = '1 hour'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return hours (e.g., "15 hours")', () => {
    const value = 15
    const expected = '15 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return days and hours (e.g., "1 day, 2 hours")', () => {
    const value = 26
    const expected = '1 day, 2 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return days and hours (e.g., "2 days, 2 hours")', () => {
    const value = 50
    const expected = '2 days, 2 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return months, days, and hours (e.g., "1 month, 2 days, 2 hours")', () => {
    const value = 770
    const expected = '1 month, 2 days, 2 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return months, days, and hours (e.g., "2 months, 1 day, 12 hours")', () => {
    const value = 1500
    const expected = '2 months, 1 day, 12 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return years, months, days, and hours (e.g., "1 year, 2 months, 2 days, 2 hours")', () => {
    const value = 10274
    const expected = '1 year, 2 months, 2 days, 2 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })

  it('should return years, months, days, and hours (e.g., "2 years, 3 months, 16 days, 23 hours")', () => {
    const value = 20135
    const expected = '2 years, 3 months, 16 days, 23 hours'
    const result = formatDurationHours(value)
    expect(result).toBe(expected)
  })
})

describe('formatDurationMinutes', () => {
  it('should return minutes (e.g., "1 minute")', () => {
    const value = 1
    const expected = '1 minute'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return minutes (e.g., "15 minutes")', () => {
    const value = 15
    const expected = '15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return hours and minutes (e.g., "1 hour, 15 minutes")', () => {
    const value = 75
    const expected = '1 hour, 15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return hourts and minutes (e.g., "2 hours, 15 minutes")', () => {
    const value = 135
    const expected = '2 hours, 15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return days, hours, and minutes (e.g., "1 day, 2 hours, 15 minutes")', () => {
    const value = 1575
    const expected = '1 day, 2 hours, 15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return days, hours, and minutes (e.g., "2 days, 2 hours, 15 minutes")', () => {
    const value = 3015
    const expected = '2 days, 2 hours, 15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return months, days, hours, and minutes (e.g., "1 month, 11 days, 18 hours, 15 minutes")', () => {
    const value = 60135
    const expected = '1 month, 11 days, 18 hours, 15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })

  it('should return months, days, hours, and minutes (e.g., "2 months, 1 day, 14 hours, 15 minutes")', () => {
    const value = 90135
    const expected = '2 months, 1 day, 14 hours, 15 minutes'
    const result = formatDurationMinutes(value)
    expect(result).toBe(expected)
  })
})

describe('formatDurationMonths', () => {
  it('should return months (e.g., "1 month")', () => {
    const value = 1
    const expected = '1 month'
    const result = formatDurationMonths(value)
    expect(result).toBe(expected)
  })

  it('should return months (e.g., "5 months")', () => {
    const value = 5
    const expected = '5 months'
    const result = formatDurationMonths(value)
    expect(result).toBe(expected)
  })

  it('should return years and months (e.g., "1 year, 3 months")', () => {
    const value = 15
    const expected = '1 year, 3 months'
    const result = formatDurationMonths(value)
    expect(result).toBe(expected)
  })

  it('should return years and months (e.g., "2 years, 11 months")', () => {
    const value = 35
    const expected = '2 years, 11 months'
    const result = formatDurationMonths(value)
    expect(result).toBe(expected)
  })
})

describe('formatDurationSeconds', () => {
  it('should return seconds (e.g., "1 second")', () => {
    const value = 1
    const expected = '1 second'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return seconds (e.g., "15 seconds")', () => {
    const value = 15
    const expected = '15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return minutes and seconds (e.g., "1 minute, 15 seconds")', () => {
    const value = 75
    const expected = '1 minute, 15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return minutes and seconds (e.g., "2 minutes, 15 seconds")', () => {
    const value = 135
    const expected = '2 minutes, 15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return hours, minutes, and seconds (e.g., "1 hour, 9 minutes, 15 seconds")', () => {
    const value = 4155
    const expected = '1 hour, 9 minutes, 15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return hours, minutes, and seconds (e.g., "2 hours, 32 minutes, 15 seconds")', () => {
    const value = 9135
    const expected = '2 hours, 32 minutes, 15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return days, hours, minutes, and seconds (e.g., "1 day, 1 hour, 2 minutes, 15 seconds")', () => {
    const value = 90135
    const expected = '1 day, 1 hour, 2 minutes, 15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })

  it('should return days, hours, minutes, and seconds (e.g., "2 days, 2 hours, 2 minutes, 15 seconds")', () => {
    const value = 180135
    const expected = '2 days, 2 hours, 2 minutes, 15 seconds'
    const result = formatDurationSeconds(value)
    expect(result).toBe(expected)
  })
})

describe('formatMonthOfYear', () => {
  it('should return month and year (e.g., "May 2024")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = 'May 2024'
    const result = formatMonthOfYear(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatQuarterOfYear', () => {
  it('should return quarter and year (e.g., "Q2 2024")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = 'Q2 2024'
    const result = formatQuarterOfYear(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatShortDate', () => {
  it('should return short date (e.g., "05/16/2024")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = '05/16/2024'
    const result = formatShortDate(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatShortDateDistanceToNow', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return short date and relative time (e.g., "05/16/2024 (4 months ago)")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const mockDate = new Date('2024-09-16T15:30:45.678-00:00')
    jest.useFakeTimers({ now: mockDate })
    const expected = '05/16/2024 • 4 months ago'
    const result = formatShortDateDistanceToNow(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatShortDateTimeDistanceToNow', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return short date and time and relative time (e.g., "05/16/2024, 3:30 PM (4 months ago)")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const mockDate = new Date('2024-09-16T15:30:45.678-00:00')
    jest.useFakeTimers({ now: mockDate })
    const expected = '05/16/2024, 3:30 PM • 4 months ago'
    const result = formatShortDateTimeDistanceToNow(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatShortDateTime', () => {
  it('should return short date and time (e.g., "05/16/2024, 3:30 PM")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = '05/16/2024, 3:30 PM'
    const result = formatShortDateTime(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatShortTime', () => {
  it('should return short time (e.g., "3:30 PM")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = '3:30 PM'
    const result = formatShortTime(value, options)
    expect(result).toBe(expected)
  })
})

describe('formatYear', () => {
  it('should return year (e.g., "2024")', () => {
    const options = { locale: 'en-US' }
    const value = '2024-05-16T15:30:45.678-00:00'
    const expected = '2024'
    const result = formatYear(value, options)
    expect(result).toBe(expected)
  })
})
