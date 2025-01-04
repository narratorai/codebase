import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import { Input, InputGroup } from '@/components/primitives/Input'

const schema = object({
  search: string().max(100),
}).required()

const resolver = zodResolver(schema)

export type ReportsSearchFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: ReportsSearchFormData
  onSubmit: (data: ReportsSearchFormData) => void
  values?: ReportsSearchFormData
}

export default function ReportsSearchForm({ values, defaultValues, onSubmit }: Props) {
  const methods = useForm({ defaultValues, values, resolver })
  const { handleSubmit, formState } = methods
  const { isSubmitting } = formState

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputGroup>
          <MagnifyingGlassIcon />
          <Input {...methods.register('search')} placeholder="Search" type="text" />
        </InputGroup>
        <button disabled={isSubmitting} hidden type="submit"></button>
      </form>
    </FormProvider>
  )
}
