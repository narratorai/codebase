import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

interface Props {
  fieldKey?: string
  fieldName?: string
  isRequired?: boolean
  labelText?: string
  placeholder?: string
  inputProps?: any
}

const StringField = ({
  fieldKey = 'string',
  fieldName,
  inputProps,
  isRequired = true,
  labelText = 'String',
  placeholder = 'Enter string',
}: Props) => {
  const { control } = useFormContext()

  return (
    <Controller
      name={fieldName ? fieldName : `source_details.${fieldKey}`}
      rules={{
        validate: (v) => {
          if (isRequired) return required(v)
        },
      }}
      control={control}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem
          label={labelText}
          meta={{ touched: isTouched, error: error?.message }}
          required={isRequired}
          hasFeedback
          layout="vertical"
        >
          <Input placeholder={placeholder} {...field} {...inputProps} />
        </FormItem>
      )}
    />
  )
}

export default StringField
