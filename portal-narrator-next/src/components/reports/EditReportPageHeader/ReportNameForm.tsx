import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import { Input } from '@/components/primitives/Input'

const schema = object({
  name: string().min(2).max(50),
}).required()

const resolver = zodResolver(schema)

export type ReportNameFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: Partial<ReportNameFormData>
  onSubmit: (data: ReportNameFormData) => Promise<void>
  values?: ReportNameFormData
}

export default function ReportNameForm({ defaultValues, onSubmit, values }: Props) {
  const { control, handleSubmit, register } = useForm<ReportNameFormData>({ defaultValues, resolver, values })

  const submitForm = handleSubmit(async (formValues) => {
    await onSubmit(formValues)
  })

  return (
    <form onSubmit={submitForm}>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Input
            {...register('name')}
            autoFocus
            data-invalid={fieldState.invalid ? '' : undefined}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                submitForm()
                event.stopPropagation()
                event.preventDefault()
              }
            }}
            placeholder="Report name"
            {...field}
          />
        )}
      />
    </form>
  )
}
