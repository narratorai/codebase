import { FormItem, SearchSelect } from 'components/antd/staged'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

export type WithinTimeFilterDefaultValues =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_60_days'
  | 'last_2_weeks'
  | 'last_2_months'
  | 'within_this_week'
  | 'within_this_month'
  | 'within_this_year'

interface Props {
  fieldName: string
  defaultValue?: WithinTimeFilterDefaultValues
  isRequired?: boolean
}

const QUICK_TIME_OPTIONS = [
  { label: 'last 7 Days', value: 'last_7_days' },
  { label: 'last 30 Days', value: 'last_30_days' },
  { label: 'last 60 Days', value: 'last_60_days' },
  { label: 'last 2 Weeks', value: 'last_2_weeks' },
  { label: 'last 2 Months', value: 'last_2_months' },
  { label: 'this Week', value: 'within_this_week' },
  { label: 'this Month', value: 'within_this_month' },
  { label: 'this Year', value: 'within_this_year' },
]

function QuickTimeFilter({ fieldName, defaultValue, isRequired }: Props) {
  const [hasSetDefaultValue, setHasSetDefaultValue] = useState(false)
  const { control, setValue, watch } = useFormContext()

  const filterValue = watch(fieldName)

  // if there was ever a value
  // make sure not to try and apply default values
  useEffect(() => {
    if (!hasSetDefaultValue && filterValue) {
      setHasSetDefaultValue(true)
    }
  }, [filterValue, hasSetDefaultValue])

  // set default value (if exists)
  // if it hasn't been set before and there is no value
  useEffect(() => {
    if (!filterValue && defaultValue && !hasSetDefaultValue) {
      setValue(fieldName, defaultValue, { shouldValidate: true })
      setHasSetDefaultValue(true)
    }
  }, [filterValue, defaultValue, hasSetDefaultValue, fieldName])

  return (
    <Controller
      control={control}
      name={fieldName}
      shouldUnregister
      rules={{ validate: isRequired ? required : undefined }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem meta={{ touched, error: error?.message }} compact>
          <SearchSelect
            data-test="quick-time-filter-select"
            style={{ minWidth: 74 }}
            popupMatchSelectWidth={false}
            placeholder="Filter type"
            options={QUICK_TIME_OPTIONS}
            allowClear
            {...field}
            // listen to filterValue instead of field.value
            // to stay up-to-date with clear
            value={filterValue}
          />
        </FormItem>
      )}
    />
  )
}

export default QuickTimeFilter
