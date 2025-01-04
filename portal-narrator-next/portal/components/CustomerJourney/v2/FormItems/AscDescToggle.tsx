import { Switch } from 'antd-next'
import { Controller, useFormContext } from 'react-hook-form'

const AscDescToggle = () => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name="asc"
      render={({ field }) => (
        <Switch
          {...field}
          checked={!field.value}
          data-test="customer-order-toggle"
          onChange={() => {
            field.onChange(!field.value)
          }}
          checkedChildren="Desc"
          unCheckedChildren="Asc"
        />
      )}
    />
  )
}

export default AscDescToggle
