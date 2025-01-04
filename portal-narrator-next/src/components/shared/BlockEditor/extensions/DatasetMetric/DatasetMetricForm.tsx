import { zodResolver } from '@hookform/resolvers/zod'
import { TwitterPicker } from 'react-color'
import { FormProvider, useForm } from 'react-hook-form'
import tinycolor from 'tinycolor2'
import { boolean, object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { ErrorMessage, Field, Label } from '@/components/primitives/Fieldset'
import { SwitchController } from '@/components/primitives/Switch'
import { DatasetSelectController } from '@/components/shared/DatasetSelect'
import DatasetColumnSelectController from '@/components/shared/DatasetSelect/DatasetColumnSelectController'
import DatasetTabSelectController from '@/components/shared/DatasetSelect/DatasetTabSelectController'

const schema = object({
  dataset: object({
    id: string().uuid('Please select a dataset'),
    tab: object({
      slug: string().max(100).nonempty('Please select a tab'),
      column: object({
        id: string().max(200).nonempty('Please select a metric column'),
      }),
    }),
  }),
  showPlot: boolean().nullish(),
  plotColor: string()
    .refine((value) => tinycolor(value).isValid(), { message: 'Invalid CSS color' })
    .nullish(),
}).required()

const resolver = zodResolver(schema)

export type DatasetMetricFormData = TypeOf<typeof schema>

interface Props {
  defaultValues?: DatasetMetricFormData
  onCancel: () => void
  onSubmit: (data: DatasetMetricFormData) => Promise<void>
  submitOnChange?: boolean
  values?: DatasetMetricFormData
}

export default function DatasetMetricForm({
  values,
  defaultValues,
  onCancel,
  onSubmit,
  submitOnChange = false,
}: Props) {
  const methods = useForm({ defaultValues, values, resolver, mode: submitOnChange ? 'onChange' : 'onSubmit' })
  const { formState, handleSubmit, setValue, watch } = methods
  const { errors, isSubmitting } = formState
  const [datasetId, datasetTabSlug, showPlot, plotColor] = watch([
    'dataset.id',
    'dataset.tab.slug',
    'showPlot',
    'plotColor',
  ])

  const resetTab = () => {
    setValue('dataset.tab.slug', '', { shouldValidate: false })
    setValue('dataset.tab.column.id', '', { shouldValidate: false })
  }

  const resetColumnId = () => {
    setValue('dataset.tab.column.id', '', { shouldValidate: false })
  }

  const submitForm = async (formValues: DatasetMetricFormData) => {
    await onSubmit(formValues)
  }

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
            datasetId={datasetId}
            name="dataset.tab.slug"
            onChange={resetColumnId}
            placeholder="Choose a tab"
          />
          {errors.dataset?.tab?.slug && <ErrorMessage>{errors.dataset.tab.slug.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="dataset.tab.column.id">Metric</Label>
          <DatasetColumnSelectController
            datasetId={datasetId}
            datasetTabSlug={datasetTabSlug}
            name="dataset.tab.column.id"
            placeholder="Choose a metric"
          />
          {errors.dataset?.tab?.column?.id && <ErrorMessage>{errors.dataset.tab.column.id.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="showPlot">Show Plot</Label>
          <SwitchController name="showPlot" />
        </Field>
        {showPlot ? (
          <Field>
            <Label htmlFor="plotColor">Plot Color</Label>
            <TwitterPicker
              color={plotColor as string}
              onChange={(color) => methods.setValue('plotColor', color.hex)}
              triangle="hide"
              width="100%"
            />
            {errors.plotColor && <ErrorMessage>{errors.plotColor.message}</ErrorMessage>}
          </Field>
        ) : null}

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
