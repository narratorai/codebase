import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'

const FirstNameInput = () => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name="first_name"
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem label="First Name" meta={{ touched, error: error?.message }} layout="vertical" compact>
          <Input data-test="add-first-name-input" {...field} />
        </FormItem>
      )}
    />
  )
}

export default FirstNameInput
