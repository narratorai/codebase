import { WidgetProps } from '@rjsf/core'
// This is effectively a copy of the antd TextWidget provided by rjsf
// https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/antd/src/widgets/TextWidget/index.js
// It has one tiny change -- sets step to 'any' for non-integer numbers so that we avoid validation errors
//@ts-ignore
import { rangeSpec } from '@rjsf/core/lib/utils'
import { AutoComplete, Input, InputNumber } from 'antd-next'
import { InputProps } from 'antd-next/es/input'
import { isArray, isEmpty } from 'lodash'
import { DefaultOptionType } from 'rc-select/lib/Select'
import { useCallback, useMemo } from 'react'

const INPUT_STYLE = {
  width: '100%',
}

const TextWidget = ({
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  schema,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext

  const handleNumberChange = useCallback((nextValue: any) => onChange(nextValue), [])

  const handleAutoCompleteChange = useCallback(
    (value: string) => onChange(value === '' ? options.emptyValue : value),
    []
  )

  const handleTextChange = useCallback(
    ({ target }: any) => onChange(target.value === '' ? options.emptyValue : target.value),
    []
  )

  const handleBlur = useCallback(({ target }: any) => onBlur(id, target.value), [])
  const handleFocus = useCallback(({ target }: any) => onFocus(id, target.value), [])

  // set step to any for decimals so that we don't get a browser validation error
  const step = schema.type === 'number' ? 'any' : undefined
  const stepProps = rangeSpec(schema) // sets step, min, and max

  const autoCompleteOptions = useMemo(
    () =>
      isArray(schema?.examples) ? schema?.examples?.map((example) => ({ label: example, value: example })) : undefined,

    [schema?.examples]
  )

  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <InputNumber
        disabled={disabled || (readonlyAsDisabled && readonly)}
        id={id}
        name={id}
        onBlur={!readonly ? handleBlur : undefined}
        onChange={!readonly ? handleNumberChange : undefined}
        onFocus={!readonly ? handleFocus : undefined}
        placeholder={placeholder}
        style={INPUT_STYLE}
        type="number"
        step={step}
        {...stepProps}
        value={value}
      />
    )
  }

  if (!isEmpty(autoCompleteOptions)) {
    return (
      <AutoComplete
        disabled={disabled || (readonlyAsDisabled && readonly)}
        id={id}
        onBlur={!readonly ? handleBlur : undefined}
        onChange={!readonly ? handleAutoCompleteChange : undefined}
        onFocus={!readonly ? handleFocus : undefined}
        placeholder={placeholder}
        style={INPUT_STYLE}
        filterOption={(inputValue, option) => {
          if (typeof option?.value === 'number') {
            return false
          }
          return option?.value?.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
        }}
        options={autoCompleteOptions as DefaultOptionType[]}
        value={value}
      />
    )
  }

  return (
    <Input
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleTextChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={INPUT_STYLE}
      type={(options.inputType as InputProps['type']) || 'text'}
      value={value}
    />
  )
}

export default TextWidget
