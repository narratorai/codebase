import { isEmpty } from 'lodash'
import moment from 'moment'
import momentTz from 'moment-timezone'

type Resolution = 'date' | 'time' | 'week' | 'month' | 'quarter' | 'year' | 'date_time' | undefined

/**
 * Convert local time to utc equivalent based on resolution
 */
export const formatLocalTimeToUTC = ({
  value,
  resolution,
  timezone,
}: {
  value: moment.MomentInput
  resolution?: Resolution
  timezone: string
}) => {
  // - Grab the selected Moment object (localValue)
  // - That Moment value will always be in the current user's local timezone
  // - Take just the raw string value (lopping off the timezone)
  const localValueNoTimezone = value && moment(value).format('YYYY-MM-DD HH:mm:ss')

  // - Use moment.tz() to explicitly state that that value is in the company's local timezone
  const convertedValue = localValueNoTimezone ? momentTz.tz(localValueNoTimezone, timezone) : null

  // if 'date_time' (empty is backfill to 'date_time')
  // return the string version of company localized timezone
  if (resolution === 'date_time' || isEmpty(resolution)) {
    return convertedValue?.toISOString() || ''
  }

  // antd will only change the resolution of the time stamp so
  // if there is a resolution, make sure you grab the start of that resolution
  // i.e. changing month to September on 2010-10-15 would return 2010-09-15 instead of 2010-09-01
  return resolution ? convertedValue?.startOf(resolution as moment.unitOfTime.StartOf)?.toISOString() || '' : ''
}
