import { InfoCircleOutlined } from '@ant-design/icons'
import { antdOverrides } from '@narratorai/theme'
import { Space } from 'antd-next'
import { PickerDateProps } from 'antd-next/es/date-picker/generatePicker'
import { formatLocalTimeToUTC } from 'components/Activities/v2/helpers'
import { DatePicker } from 'components/antd/TimeComponents'
import { useCompany } from 'components/context/company/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty, isEqual, isString } from 'lodash'
import moment from 'moment'
import momentTz, { MomentInput } from 'moment-timezone'
import React, { useCallback, useEffect, useMemo } from 'react'
import usePrevious from 'util/usePrevious'

type Resolution = 'date' | 'time' | 'week' | 'month' | 'quarter' | 'year' | 'date_time' | undefined

interface Props extends Omit<PickerDateProps<moment.Moment>, 'value' | 'onChange'> {
  value: moment.MomentInput | MomentInput | null
  onChange?: (value: string | null) => void
  resolution?: Resolution
}

// Wrap AntD's DatePicker so we make sure the value is always converted from UTC
// into the company's local timezone for 'date_time'.
// If we didn't do this it would always set values based on the local computer's timezone
// All other resolutions will be at the begining of the UTC day
const CompanyTimezoneDatePicker = ({
  value,
  onChange,
  resolution,
  allowClear = true, // antd's DatePicker defaults allowClear to true
  ...rest
}: Props) => {
  const company = useCompany()
  const prevResolution = usePrevious(resolution)

  // If it's a non empty string or moment object, convert to local company's timezone
  const momentValue: moment.Moment | null = useMemo(() => {
    if ((isString(value) && value) || moment.isMoment(value)) {
      return moment(
        momentTz
          .utc(value as momentTz.MomentInput)
          .tz(company.timezone)
          .toObject()
      )
    }
    return null
  }, [company.timezone, value])

  // Handle when the user's local timezone does not match the company's local timezone
  const onChangeOverride = useCallback(
    (localValue: moment.Moment | null, _dateString: string) => {
      // if allowClear is true - set value to null
      if (!localValue && allowClear && onChange) {
        return onChange(null)
      }

      // otherwise set local value if it exists
      if (onChange && localValue) {
        const valueString = formatLocalTimeToUTC({ value: localValue, resolution, timezone: company.timezone })
        onChange(valueString)
      }
    },
    [onChange, company.timezone, resolution]
  )

  useEffect(() => {
    // If the resolution changed
    if (prevResolution && !isEqual(prevResolution, resolution)) {
      // and there is a non empty string or moment object value
      if ((isString(value) && value) || moment.isMoment(value)) {
        // update time value to be the beginning of resolution
        onChangeOverride(moment(value), '')
      }
    }
  }, [prevResolution, resolution, value, onChangeOverride])

  // default to date (date_time will be evaluated in 'showTime')
  let picker = resolution
  if (!resolution || resolution == 'date_time') {
    picker = 'date'
  }

  let showTime: boolean | Props['showTime'] = false
  if (resolution === 'date_time' || isEmpty(resolution)) {
    showTime = {
      defaultValue: moment(momentTz().tz(company.timezone).startOf('day').toObject()),
    }
  }

  return (
    <DatePicker
      data-test="company-timezone-date-picker"
      // add 'key' to make sure the dropdown menu updates when switching resolution
      key={`${resolution}_${value}`}
      picker={picker as Required<Exclude<Resolution, 'date_time'>>}
      value={momentValue}
      onChange={onChangeOverride}
      renderExtraFooter={() => {
        // Render notice if company's timezone does not match local timezone and showing time ('date_time'):
        if (resolution === 'date_time' && momentTz.tz(company.timezone).utcOffset() !== moment().utcOffset()) {
          return (
            <Box py={1}>
              <Space>
                {/* @gold-base is the warning color! */}
                <InfoCircleOutlined style={{ color: antdOverrides['@gold-base'] }} />
                <Typography color={antdOverrides['@gold-base']}>
                  Note, all timestamp filters will be in your company's local timezone: {company.timezone}
                </Typography>
              </Space>
            </Box>
          )
        }
        return null
      }}
      // show time for 'date_time' and make sure default time value is 00:00:00
      showTime={showTime}
      allowClear={allowClear}
      data-public
      {...rest}
    />
  )
}

export default CompanyTimezoneDatePicker
