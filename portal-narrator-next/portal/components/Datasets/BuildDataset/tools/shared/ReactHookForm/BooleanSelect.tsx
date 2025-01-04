import { FormItem, SearchSelect } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

const BOOLEAN_OPTIONS = [
  { label: 'True', value: 'True' },
  { label: 'False', value: 'False' },
]

interface Props {
  filterFieldName: string
}

function BooleanSelect({ filterFieldName }: Props) {
  const { control } = useFormContext()

  const valueFieldName = `${filterFieldName}.value`

  return (
    <Controller
      control={control}
      rules={{ validate: required }}
      name={valueFieldName}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem noStyle compact meta={{ touched, error: error?.message }}>
          <SearchSelect
            style={{ minWidth: 80 }}
            placeholder="Value"
            options={BOOLEAN_OPTIONS}
            popupMatchSelectWidth={false}
            {...field}
          />
        </FormItem>
      )}
    />
  )
}

export default BooleanSelect
