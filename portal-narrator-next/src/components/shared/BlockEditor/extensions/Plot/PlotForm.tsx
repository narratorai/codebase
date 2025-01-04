import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { ErrorMessage, Field, Label } from '@/components/primitives/Fieldset'
import DatasetPlotSelectController, {
  OnChangeContext,
} from '@/components/shared/DatasetSelect/DatasetPlotSelectController'
import DatasetSelectController from '@/components/shared/DatasetSelect/DatasetSelectController'

const schema = object({
  dataset: object({
    id: string().uuid('Please select a dataset'),
    tab: object({
      slug: string().max(100).nonempty('Please select a dataset tab'),
      plot: object({
        slug: string().max(100).nonempty('Please select a dataset tab'),
      }),
    }),
  }),
}).required()

const resolver = zodResolver(schema)

export type PlotFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: PlotFormData
  onCancel: () => void
  onChange?: (data: PlotFormData) => void
  onSubmit: (data: PlotFormData) => Promise<void>
  values?: PlotFormData
}

export default function PlotForm({ values, defaultValues, onCancel, onChange, onSubmit }: Props) {
  const methods = useForm({ defaultValues, values, resolver })
  const { formState, handleSubmit, setValue, watch } = methods
  const { errors, isSubmitting } = formState
  const formValues = watch()

  const resetPlotSlug = () => {
    setValue('dataset.tab.plot.slug', '', { shouldValidate: false })
  }

  const setTabSlug = (_: string, context: OnChangeContext) => {
    setValue('dataset.tab.slug', context.tab.slug ?? '', { shouldValidate: false })
  }

  const submitForm = async (formValues: PlotFormData) => {
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
          <DatasetSelectController name="dataset.id" onChange={resetPlotSlug} placeholder="Choose a dataset" />
          {errors.dataset?.id && <ErrorMessage>{errors.dataset.id.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="dataset.tab.plot.slug">Plot</Label>
          <DatasetPlotSelectController
            datasetId={formValues.dataset.id}
            name="dataset.tab.plot.slug"
            onChange={setTabSlug}
            placeholder="Choose a plot"
          />
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
