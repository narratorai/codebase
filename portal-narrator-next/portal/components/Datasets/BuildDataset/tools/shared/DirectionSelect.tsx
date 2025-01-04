import { Select } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Field } from 'react-final-form'
import { required } from 'util/forms'

interface Props {
  fieldName: string
}

const DirectionSelect = ({ fieldName }: Props) => {
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
    <Field
      name={fieldName}
      validate={required}
      render={({ input, meta }) => (
        <FormItem label="Define Sort Order" meta={meta} required layout="vertical">
          <Select
            style={{ minWidth: 100 }}
            placeholder="Direction"
            popupMatchSelectWidth={false}
            options={options}
            {...input}
          />
        </FormItem>
      )}
    />
  )
}
export default DirectionSelect
