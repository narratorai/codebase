import { Radio } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Field } from 'react-final-form'
import { required } from 'util/forms'

interface Props {
  fieldName: string
  isRequired?: boolean
}

const BooleanRadio = ({ fieldName, isRequired = true }: Props) => {
  return (
    <Field
      name={fieldName}
      validate={isRequired ? required : undefined}
      render={({ input, meta }) => (
        <FormItem label="True or False" meta={meta} required={isRequired} layout="vertical">
          <Radio.Group {...input} buttonStyle="solid">
            <Radio value="true">True</Radio>
            <Radio value="false">False</Radio>
          </Radio.Group>
        </FormItem>
      )}
    />
  )
}

export default BooleanRadio
