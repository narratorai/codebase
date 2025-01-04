import { InputNumberProps } from 'antd/es/input-number'
import { InputNumber } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { useField } from 'react-final-form'
import { required } from 'util/forms'

interface Props extends InputNumberProps {
  labelText?: string
  isRequired?: boolean
  fieldKey?: string
  fieldName: string
}

const NumberField = ({
  labelText,
  isRequired = true,
  fieldKey = 'number',
  fieldName,
  defaultValue = undefined,
  ...props
}: Props) => {
  const fieldNameWithDefault = fieldName || `source_details.${fieldKey}`

  const { input, meta } = useField(fieldNameWithDefault, {
    subscription: { value: true },
    validate: required,
    defaultValue,
  })

  if (labelText) {
    return (
      <FormItem label={labelText} meta={meta} required={isRequired} layout="vertical">
        <InputNumber {...input} {...props} />
      </FormItem>
    )
  }

  return <InputNumber {...input} {...props} />
}

export default NumberField
