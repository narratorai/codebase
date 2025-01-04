import { Controller, useFormContext } from 'react-hook-form'

import CustomerSelect from '@/components/shared/CustomerSelect'

const CustomerInput = () => {
  const { control } = useFormContext()

  return (
    <fieldset className="space-y-2">
      <label htmlFor="customer" className="px-1 text-sm font-medium text-gray-1000">
        Customer
      </label>
      <Controller
        name="customer"
        control={control}
        render={({ field }) => <CustomerSelect onValueChange={([firstItem]: string[]) => field.onChange(firstItem)} />}
      />
    </fieldset>
  )
}

export default CustomerInput
