import { FormItem, SearchSelect } from 'components/antd/staged'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

const OPTIONS = [
  {
    label: 'Add',
    value: '+',
  },
  {
    label: 'Subtract',
    value: '-',
  },
  {
    label: 'Multiply',
    value: '*',
  },
  {
    label: 'Divide',
    value: '/',
  },
  {
    label: 'Modulo',
    value: '%',
  },
]

const FIELDNAME = 'source_details.operation'

interface Props {
  defaultValue?: string
  isRequired?: boolean
}

const MathOperatorSelect = ({ defaultValue, isRequired = false }: Props) => {
  const { control, watch, setValue } = useFormContext()

  const selectValue = watch(FIELDNAME)
  const selectOnChange = (value: string) => setValue(FIELDNAME, value)

  // add defaultValue to formstate if present and no value set
  useEffect(() => {
    if (isEmpty(selectValue) && defaultValue) {
      selectOnChange(defaultValue)
    }
  }, [defaultValue, selectValue, selectOnChange])

  return (
    <Controller
      name={FIELDNAME}
      control={control}
      rules={{
        validate: (v) => {
          if (isRequired) return required(v)
        },
      }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem noStyle meta={{ touched, error: error?.message }}>
          <SearchSelect
            placeholder="Select Operator"
            options={OPTIONS}
            popupMatchSelectWidth={false}
            style={{ minWidth: '64px' }}
            {...field}
          />
        </FormItem>
      )}
    />
  )
}

export default MathOperatorSelect
