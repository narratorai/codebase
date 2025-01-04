import { Checkbox } from 'antd-next'
import { Controller, useFormContext } from 'react-hook-form'

export const OrNull = ({ filterFieldName }: { filterFieldName: string }) => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={`${filterFieldName}.or_null`}
      render={({ field }) => {
        const { value, ...rest } = field
        return (
          <Checkbox checked={value === true} {...rest}>
            Or Null
          </Checkbox>
        )
      }}
    />
  )
}

export default OrNull
