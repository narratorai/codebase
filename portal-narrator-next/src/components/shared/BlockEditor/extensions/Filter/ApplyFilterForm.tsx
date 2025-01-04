import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'

const schema = object({
  value: string().nullish(),
}).required()

const resolver = zodResolver(schema)

export type ApplyFilterFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: ApplyFilterFormData
  filter: {
    operator: string
    type: string
    defaultValue?: string | null
    constraintList?: any[]
  }
  values?: ApplyFilterFormData
  onSubmit: (data: ApplyFilterFormData) => Promise<void>
}

export default function ApplyFilterForm({ defaultValues, values, filter, onSubmit }: Props) {
  const methods = useForm({ defaultValues, values, resolver })
  const { handleSubmit, formState } = methods
  const { isSubmitting } = formState
  const { operator, type, defaultValue } = filter

  const submitForm = async (formValues: ApplyFilterFormData) => {
    await onSubmit(formValues)
  }

  return (
    <FormProvider {...methods}>
      <form className="space-y-4" onSubmit={handleSubmit(submitForm)}>
        <div className="overflow-hidden rounded-md bordered-gray-100 flex-x-center">
          <span className="bg-gray-50 px-4 py-2.5 text-sm">{operator.replaceAll('_', ' ')}</span>
          <Input
            {...methods.register('value')}
            defaultValue={defaultValue as any}
            type={type === 'string' ? 'text' : type}
          />
        </div>
        <div className="justify-end space-x-2 flex-x-center">
          <Button disabled={isSubmitting} type="submit">
            Save
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
