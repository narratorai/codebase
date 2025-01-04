import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'

interface Props {
  disabled?: boolean
}

const SendEmailToggle = ({ disabled }: Props) => {
  const { control } = useFormContext()

  return (
    <Controller
      name="answer"
      control={control}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem
          label="Reply email content"
          layout="vertical"
          compact
          meta={{ touched: isTouched, error: error?.message }}
        >
          <Input.TextArea {...field} rows={4} disabled={disabled} />
        </FormItem>
      )}
    />
  )
}

export default SendEmailToggle
