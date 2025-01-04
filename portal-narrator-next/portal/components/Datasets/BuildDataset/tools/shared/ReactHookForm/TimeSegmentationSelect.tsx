import { SelectProps } from 'antd/lib/select'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { includes, isEmpty, map, words } from 'lodash'
import pluralize from 'pluralize'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import {
  SIMPLE_TIME_FILTER_OPTIONS,
  TIME_FILTER_ALL_OPTIONS,
  TIME_FILTER_ALL_OPTIONS_DATE_PART,
  TIME_FILTER_COLLOQUIAL_OPTIONS,
  TIME_FILTER_KIND_COLLOQUIAL,
  TIME_FILTER_KIND_RELATIVE,
} from 'util/datasets'
import { required } from 'util/forms'

interface Props extends SelectProps {
  fieldName?: string
  kind?: string
  plural?: boolean
  defaultValue?: string
  isDatePart?: boolean
  useSimpleOptions?: boolean
  shouldUnregister?: boolean
  allowClear?: boolean
  isRequired?: boolean
}

const TimeSegmentationSelect = ({
  fieldName = 'source_details.segmentation',
  kind = undefined,
  plural = false,
  defaultValue = undefined,
  isDatePart = false,
  useSimpleOptions = false,
  shouldUnregister,
  allowClear = false,
  isRequired = true,
  ...rest
}: Props) => {
  const { control, watch, setValue } = useFormContext()
  const selectValue = watch(fieldName)
  const selectOnChange = useCallback(
    (value?: string) => {
      // force to null for react-hook-form to pick up allowClear action
      setValue(fieldName, value || null, { shouldValidate: true })
    },
    [setValue, fieldName]
  )

  const appendLabel = kind === TIME_FILTER_KIND_RELATIVE ? ' ago' : ''

  const options = useMemo(() => {
    if (isDatePart) {
      return map(TIME_FILTER_ALL_OPTIONS_DATE_PART, (time) => ({
        label: time,
        //  "day of week" is exclusive to date part columns
        //  take out spaces in "day of week" -> "dayofweek"
        value: words(time).join(''),
      }))
    }

    if (kind === TIME_FILTER_KIND_COLLOQUIAL) {
      return map(TIME_FILTER_COLLOQUIAL_OPTIONS, (time) => ({
        label: `the ${time}`,
        value: time,
      }))
    }

    if (useSimpleOptions) {
      return map(SIMPLE_TIME_FILTER_OPTIONS, (time) => ({ label: time, value: time }))
    }

    return map(TIME_FILTER_ALL_OPTIONS, (time) => ({
      label: (plural ? pluralize(time) : time) + appendLabel,
      value: time,
    }))
  }, [isDatePart, kind, useSimpleOptions])

  useEffect(() => {
    // if there is a default value and non has been selected yet
    if (defaultValue && isEmpty(selectValue)) {
      const optionValues = map(options, (op) => op.value)
      // if the default option is selectable
      if (includes(optionValues, defaultValue)) {
        // select it
        selectOnChange(defaultValue)
      }
    }
  }, [defaultValue, selectValue, selectOnChange, options])

  return (
    <Controller
      name={fieldName}
      rules={{ validate: isRequired ? required : undefined }}
      control={control}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem noStyle meta={{ touched, error: error?.message }}>
          <SearchSelect
            style={{ maxWidth: 240, minWidth: 64 }}
            placeholder="Resolution"
            options={options}
            popupMatchSelectWidth={false}
            allowClear={allowClear}
            {...field}
            onChange={selectOnChange}
            {...rest}
          />
        </FormItem>
      )}
    />
  )
}

export default TimeSegmentationSelect
