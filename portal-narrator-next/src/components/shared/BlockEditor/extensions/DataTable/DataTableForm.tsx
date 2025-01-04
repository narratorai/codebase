import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { ErrorMessage, Field, Label } from '@/components/primitives/Fieldset'
import DatasetSelectController from '@/components/shared/DatasetSelect/DatasetSelectController'
import DatasetTabSelectController from '@/components/shared/DatasetSelect/DatasetTabSelectController'

const schema = object({
  dataset: object({
    id: string().uuid(),
    tab: object({
      slug: string().max(100).nonempty('Please select a tab'),
    }),
  }),
}).required()

const resolver = zodResolver(schema)

export type DataTableFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: DataTableFormData
  onCancel: () => void
  onChange?: (data: DataTableFormData) => void
  onSubmit: (data: DataTableFormData) => Promise<void>
  values?: DataTableFormData
}

export default function DataTableForm({ values, defaultValues, onCancel, onChange, onSubmit }: Props) {
  const methods = useForm({ defaultValues, values, resolver })
  const { handleSubmit, formState, watch, setValue } = methods
  const { errors, isSubmitting } = formState
  const formValues = watch()

  const resetTab = () => {
    setValue('dataset.tab.slug', '', { shouldValidate: false })
  }

  const submitForm = async (formValues: DataTableFormData) => {
    await onSubmit(formValues)
  }

  useEffect(() => {
    onChange?.(formValues)
  }, [JSON.stringify(formValues)])

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
        <Field>
          <Label htmlFor="dataset.id">Dataset</Label>
          <DatasetSelectController name="dataset.id" onChange={resetTab} placeholder="Choose a dataset" />
          {errors.dataset?.id && <ErrorMessage>{errors.dataset.id.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="dataset.tab.slug">Tab</Label>
          <DatasetTabSelectController
            datasetId={formValues.dataset.id}
            name="dataset.tab.slug"
            placeholder="Choose a tab"
          />
          {errors.dataset?.tab?.slug && <ErrorMessage>{errors.dataset.tab.slug.message}</ErrorMessage>}
        </Field>

        <div className="justify-end space-x-2 flex-x-center">
          <Button disabled={isSubmitting} onClick={onCancel} plain type="button">
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
