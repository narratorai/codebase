import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'

const LastNameInput = () => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={'last_name'}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem label="Last Name" meta={{ touched, error: error?.message }} layout="vertical" compact>
          <Input {...field} />
        </FormItem>
      )}
    />
  )
}

export default LastNameInput
