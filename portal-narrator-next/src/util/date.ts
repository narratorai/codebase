import { isBefore } from 'date-fns'

import { adjustTimeZone } from './formatters'

export const isDateBefore = (date: string | Date, dateToCompare: string | Date): boolean => {
  const adjustedDate = adjustTimeZone(date)
  const adjustedDateToCompare = adjustTimeZone(dateToCompare)
  return isBefore(adjustedDate, adjustedDateToCompare)
}
