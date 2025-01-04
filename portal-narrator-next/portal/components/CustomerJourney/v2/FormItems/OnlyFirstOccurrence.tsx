import { Checkbox } from 'antd-next'
import { Controller, useFormContext } from 'react-hook-form'

const OnlyFirstOccurence = () => {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name="only_first_occurrence"
      render={({ field }) => (
        <Checkbox checked={!!field.value} {...field}>
          Only First Occurrence
        </Checkbox>
      )}
    />
  )
}

export default OnlyFirstOccurence
