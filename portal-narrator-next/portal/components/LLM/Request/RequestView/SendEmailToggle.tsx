import { Switch } from 'antd-next'
import { Controller, useFormContext } from 'react-hook-form'

interface Props {
  disabled?: boolean
}

const SendEmailToggle = ({ disabled }: Props) => {
  const { control } = useFormContext()

  return (
    <Controller
      name="email_requester"
      control={control}
      render={({ field }) => (
        <Switch
          checked={field.value}
          onChange={field.onChange}
          checkedChildren="Send Email"
          unCheckedChildren="Do not send email"
          disabled={disabled}
        />
      )}
    />
  )
}

export default SendEmailToggle
