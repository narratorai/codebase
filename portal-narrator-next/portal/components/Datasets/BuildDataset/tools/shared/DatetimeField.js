import { Input } from 'antd-next'
import CompanyTimezoneDatePicker from 'components/antd/CompanyTimezoneDatePicker'
import { SearchSelect } from 'components/antd/staged'
import { isEmpty, map, startCase } from 'lodash'
import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Field, useField } from 'react-final-form'
import { DATE_TIME_FIELD_RESOLUTIONS } from 'util/datasets'
import { required } from 'util/forms'

const RESOLUTION_OPTIONS = map(DATE_TIME_FIELD_RESOLUTIONS, (res) => ({ value: res, label: startCase(res) }))

const ResolutionAndTimeValue = ({ fieldName, resolution, ...rest }) => (
  <>
    <Field
      name={`${fieldName}_resolution`}
      render={({ input }) => {
        return (
          <SearchSelect
            options={RESOLUTION_OPTIONS}
            value={input.value}
            onChange={input.onChange}
            popupMatchSelectWidth={false}
            style={{ minWidth: '72px' }}
          />
        )
      }}
    />

    <Field
      name={fieldName}
      validate={required}
      render={({ input }) => {
        return <CompanyTimezoneDatePicker style={{ maxWidth: 160 }} resolution={resolution} {...input} {...rest} />
      }}
    />
  </>
)

const DatetimeField = ({ fieldName, asGroup = false, ...rest }) => {
  const {
    input: { value: timeValue },
  } = useField(fieldName)

  const {
    input: { value: resolution, onChange: onChangeResolution },
  } = useField(`${fieldName}_resolution`, { subscription: { value: true } })

  useEffect(() => {
    // set resolution if none exists
    if (isEmpty(resolution)) {
      // as a backfill, default resolution to 'date_time' if there was a value, but no resolution
      if (!isEmpty(timeValue)) {
        onChangeResolution('date_time')
      }

      // if no resolution and no value, we will default to 'date' (new default)
      if (isEmpty(timeValue)) {
        onChangeResolution('date')
      }
    }
  }, [resolution, timeValue, onChangeResolution])

  // use asGroup if it's stand alone (if you put it in an Input.Group inside of another Input.Group it wont align horizontally)
  if (asGroup) {
    return (
      <Input.Group compact>
        <ResolutionAndTimeValue fieldName={fieldName} resolution={resolution} rest={rest} />
      </Input.Group>
    )
  }

  // don't use group when already within an Input.Group
  return <ResolutionAndTimeValue fieldName={fieldName} resolution={resolution} rest={rest} />
}

DatetimeField.defaultProps = {
  labelText: 'Datetime',
}

DatetimeField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  labelText: PropTypes.string.isRequired,
}

export default DatetimeField
