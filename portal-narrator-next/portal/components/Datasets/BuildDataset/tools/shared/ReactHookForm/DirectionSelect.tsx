import { Select } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

interface Props {
  fieldName: string
}

const DirectionSelect = ({ fieldName }: Props) => {
  const { control } = useFormContext()

  const options = [
    {
      label: 'Ascending',
      value: 'asc',
    },
    {
      label: 'Descending',
      value: 'desc',
    },
  ]

  return (
    <Controller
      name={fieldName}
      control={control}
      rules={{ validate: required }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem label="Define Sort Order" meta={{ touched, error: error?.message }} layout="vertical">
          <Select
            style={{ minWidth: 100 }}
            placeholder="Direction"
            popupMatchSelectWidth={false}
            options={options}
            {...field}
          />
        </FormItem>
      )}
    />
  )
}

export default DirectionSelect
