import { zodResolver } from '@hookform/resolvers/zod'
import cronstrue from 'cronstrue'
import { FormProvider, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { Description, Field, FieldGroup, Label } from '@/components/primitives/Fieldset'
import { Input } from '@/components/primitives/Input'

const schema = object({
  label: string().min(5).max(100),
  cronSchedule: string().refine(
    (value) => {
      try {
        cronstrue.toString(value, { throwExceptionOnParseError: true })
        return true
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        return false
      }
    },
    {
      message: 'Invalid cron schedule',
    }
  ),
}).required()

const resolver = zodResolver(schema)

export type ReportScheduleFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: ReportScheduleFormData
  onCancel: () => void
  onSubmit: (data: ReportScheduleFormData) => Promise<void>
  values?: ReportScheduleFormData
}

export default function ReportScheduleForm({ values, defaultValues, onCancel, onSubmit }: Props) {
  const methods = useForm({ defaultValues, values, resolver })
  const { handleSubmit, formState, register, watch } = methods
  const { isSubmitting, errors } = formState
  const cronSchedule = watch('cronSchedule')

  const submitForm = async (formValues: ReportScheduleFormData) => {
    await onSubmit(formValues)
  }

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
        <FieldGroup>
          <Field>
            <Label htmlFor="label">Label</Label>
            <Input {...register('label')} data-invalid={errors.label ? '' : undefined} />
          </Field>
          <Field>
            <Label htmlFor="cronSchedule">Cron Schedule</Label>
            <Input {...register('cronSchedule')} data-invalid={errors.cronSchedule ? '' : undefined} />
            <Description>
              {cronSchedule
                ? cronstrue.toString(cronSchedule, { verbose: true, throwExceptionOnParseError: false })
                : null}
            </Description>
          </Field>
        </FieldGroup>

        <div className="justify-end space-x-2 flex-x-center">
          <Button onClick={onCancel} plain type="button">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            Save
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
