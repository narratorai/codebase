import { Radio } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

interface Props {
  fieldName: string
  isRequired?: boolean
}

const BooleanRadio = ({ fieldName, isRequired = true }: Props) => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      rules={{
        validate: (v) => {
          if (isRequired) {
            return required(v)
          }
        },
      }}
      name={fieldName}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem
          label="True or False"
          meta={{ touched, error: error?.message }}
          required={isRequired}
          layout="vertical"
        >
          <Radio.Group {...field} buttonStyle="solid">
            <Radio value="true">True</Radio>
            <Radio value="false">False</Radio>
          </Radio.Group>
        </FormItem>
      )}
    />
  )
}

export default BooleanRadio
