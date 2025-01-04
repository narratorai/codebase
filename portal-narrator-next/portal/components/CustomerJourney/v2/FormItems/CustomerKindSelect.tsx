import { FormItem, SearchSelect } from 'components/antd/staged'
import { Controller, useFormContext } from 'react-hook-form'
import { required } from 'util/forms'

import { CUSTOMER_KIND_OPTIONS } from '../services/constants'

interface Props {
  onSubmit: () => void
}

function CustomerKindSelect({ onSubmit }: Props) {
  const { control, setValue } = useFormContext()

  // re-run the customer journey every time they change the customer kind
  const onChangeCustomerKind = async (value: string) => {
    // wait for customer_kind value to update, before submitting
    await setValue('customer_kind', value, { shouldValidate: true })

    onSubmit()
  }

  return (
    <Controller
      control={control}
      name="customer_kind"
      rules={{ validate: required }}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem label="Kind" meta={{ touched: isTouched, error: error?.message }} layout="vertical" compact>
          <SearchSelect options={CUSTOMER_KIND_OPTIONS} {...field} onChange={onChangeCustomerKind} />
        </FormItem>
      )}
    />
  )
}

export default CustomerKindSelect
