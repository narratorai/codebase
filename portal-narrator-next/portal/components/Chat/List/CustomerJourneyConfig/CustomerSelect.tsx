import { FormItem, SearchSelect } from 'components/antd/staged'
import { map } from 'lodash'
import { IMessage } from 'portal/stores/chats'
import { useFormContext } from 'react-hook-form'

interface CustomerOptions {
  customer: string
  customer_display_name?: string | null
}

interface Props {
  message: IMessage
  disabled: boolean
}

const CustomerSelect = ({ message, disabled }: Props) => {
  const { watch, setValue } = useFormContext()
  const customer = watch('customer')
  const onChange = (value: string) => {
    setValue('customer', value, { shouldValidate: true })
  }

  const customerOptions = message.data?.customer_options as CustomerOptions[]
  const options = map(customerOptions, (option) => {
    if (option.customer_display_name) {
      return {
        label: option.customer_display_name,
        value: option.customer,
      }
    }

    return {
      label: option.customer,
      value: option.customer,
    }
  })

  return (
    <FormItem label="Customer" layout="vertical" compact>
      <SearchSelect onChange={onChange} value={customer} options={options} disabled={disabled} />
    </FormItem>
  )
}

export default CustomerSelect
