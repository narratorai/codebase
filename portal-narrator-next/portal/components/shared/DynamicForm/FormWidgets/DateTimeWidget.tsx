import { WidgetProps } from '@rjsf/core'
import { DatePicker } from 'components/antd/TimeComponents'
import moment from 'moment'

const DATE_PICKER_STYLE = {
  width: '100%',
}

/**
 * Forked from
 * https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/antd/src/widgets/DateTimeWidget/index.tsx
 *
 * Modified to use antd-custom date picket widget and moment instead of dayjs
 */
const DateTimeWidget = ({
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readonly,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext

  const handleChange = (nextValue: any) => onChange(nextValue && nextValue.toISOString())

  const handleBlur = () => onBlur(id, value)

  const handleFocus = () => onFocus(id, value)

  const getPopupContainer = (node: any) => node.parentNode

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime
      style={DATE_PICKER_STYLE}
      value={value && moment(value)}
    />
  )
}

export default DateTimeWidget
