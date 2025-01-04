import { WidgetProps } from '@rjsf/core'
// This is effectively a copy of the antd TextWidget provided by rjsf
// https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/antd/src/widgets/TextWidget/index.js
// It has one tiny change -- sets step to 'any' for non-integer numbers so that we avoid validation errors
//@ts-ignore
import { rangeSpec } from '@rjsf/core/lib/utils'
import { InputNumber } from 'antd-next'
import { isNumber, round } from 'lodash'

const PercentWidget = ({
  id,
  value,
  formContext,
  disabled,
  readonly,
  onChange,
  onFocus,
  onBlur,
  schema,
  placeholder,
}: WidgetProps) => {
  // convert value into a decimal
  const handleChange = (value?: string | number | null) => {
    // have to round b/c javascript is bad at math and will give you ~.00000000001 off sometimes
    // https://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript
    const formattedToPercent = isNumber(value) ? round(value / 100, 12) : value

    onChange(formattedToPercent)
  }

  const handleBlur = ({ target }: any) => onBlur(id, target.value)
  const handleFocus = ({ target }: any) => onFocus(id, target.value)

  const { readonlyAsDisabled = true } = formContext
  const stepProps = rangeSpec(schema) // sets step, min, and max

  return (
    <InputNumber
      id={id}
      name={id}
      // show value as a whole number (convert from percent)
      // (also have to round b/c javascript is bad at math and will give you ~.00000000001 off sometimes)
      // https://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript
      value={round(value * 100, 12)}
      formatter={(value) => `${value}%`}
      placeholder={placeholder}
      style={{ width: '100%' }}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      {...stepProps}
    />
  )
}

export default PercentWidget
