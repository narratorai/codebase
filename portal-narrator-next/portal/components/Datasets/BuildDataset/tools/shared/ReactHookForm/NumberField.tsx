import { InputNumberProps } from 'antd/es/input-number'
import { InputNumber } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { isFinite } from 'lodash'
import React, { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

interface Props extends InputNumberProps {
  labelText?: string
  isRequired?: boolean
  fieldKey?: string
  fieldName?: string
  shouldUnregister?: boolean
}

const NumberField = ({
  labelText,
  isRequired = true,
  fieldKey = 'number',
  fieldName,
  defaultValue = undefined,
  shouldUnregister,
  ...props
}: Props) => {
  const { control, setValue, watch } = useFormContext()
  const fieldNameWithDefault = fieldName || `source_details.${fieldKey}`

  const value = watch(fieldNameWithDefault)

  // if default value passed and no current value
  // set default value
  useEffect(() => {
    if (isFinite(defaultValue) && !isFinite(value)) {
      setValue(fieldNameWithDefault, defaultValue, { shouldValidate: true })
    }
  }, [defaultValue, value, setValue, fieldNameWithDefault])

  return (
    <Controller
      name={fieldNameWithDefault}
      shouldUnregister={shouldUnregister}
      rules={{
        validate: (v) => {
          if (isRequired) return required(v)
        },
      }}
      control={control}
      render={({ field, fieldState: { isTouched: touched, error } }) => {
        if (labelText) {
          return (
            <FormItem
              label={labelText}
              meta={{ touched, error: error?.message }}
              required={isRequired}
              layout="vertical"
            >
              <InputNumber {...field} {...props} />
            </FormItem>
          )
        }

        return <InputNumber {...field} {...props} />
      }}
    />
  )
}

export default NumberField
