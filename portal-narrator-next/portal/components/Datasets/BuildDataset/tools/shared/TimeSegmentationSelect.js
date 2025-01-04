import { FormItem, SearchSelect } from 'components/antd/staged'
import _ from 'lodash'
import pluralize from 'pluralize'
import React, { useEffect, useMemo } from 'react'
import { Field, useField } from 'react-final-form'
import {
  SIMPLE_TIME_FILTER_OPTIONS,
  TIME_FILTER_ALL_OPTIONS,
  TIME_FILTER_ALL_OPTIONS_DATE_PART,
  TIME_FILTER_COLLOQUIAL_OPTIONS,
  TIME_FILTER_KIND_COLLOQUIAL,
  TIME_FILTER_KIND_RELATIVE,
} from 'util/datasets'
import { required } from 'util/forms'

const TimeSegmentationSelect = ({
  fieldName = 'source_details.segmentation',
  kind = undefined,
  plural = false,
  defaultValue = undefined,
  isDatePart = false,
  useSimpleOptions = false,
  ...rest
}) => {
  const appendLabel = kind === TIME_FILTER_KIND_RELATIVE ? ' ago' : ''

  const {
    input: { value: selectValue, onChange: selectOnChange },
  } = useField(fieldName, { subscription: { value: true } })

  const options = useMemo(() => {
    if (isDatePart) {
      return _.map(TIME_FILTER_ALL_OPTIONS_DATE_PART, (time) => ({
        label: time,
        //  "day of week" is exclusive to date part columns
        //  take out spaces in "day of week" -> "dayofweek"
        value: _.words(time).join(''),
      }))
    }

    if (kind === TIME_FILTER_KIND_COLLOQUIAL) {
      return _.map(TIME_FILTER_COLLOQUIAL_OPTIONS, (time) => ({
        label: `the ${time}`,
        value: time,
      }))
    }

    if (useSimpleOptions) {
      return _.map(SIMPLE_TIME_FILTER_OPTIONS, (time) => ({ label: time, value: time }))
    }

    return _.map(TIME_FILTER_ALL_OPTIONS, (time) => ({
      label: (plural ? pluralize(time) : time) + appendLabel,
      value: time,
    }))
  }, [isDatePart, kind, useSimpleOptions])

  useEffect(() => {
    // if there is a default value and non has been selected yet
    if (defaultValue && _.isEmpty(selectValue)) {
      const optionValues = _.map(options, (op) => op.value)
      // if the default option is selectable
      if (_.includes(optionValues, defaultValue)) {
        // select it
        selectOnChange(defaultValue)
      }
    }
  }, [defaultValue, selectValue, selectOnChange, options])

  return (
    <Field
      name={fieldName}
      validate={required}
      render={({ input, meta }) => (
        <FormItem noStyle meta={meta} required={required}>
          <SearchSelect
            style={{ maxWidth: 240, minWidth: 64 }}
            placeholder="Resolution"
            options={options}
            popupMatchSelectWidth={false}
            {...input}
            {...rest}
          />
        </FormItem>
      )}
    />
  )
}

export default TimeSegmentationSelect
