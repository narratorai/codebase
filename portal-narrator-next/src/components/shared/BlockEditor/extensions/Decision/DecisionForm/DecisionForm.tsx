import { zodResolver } from '@hookform/resolvers/zod'
import { isEmpty, startCase } from 'lodash'
import { TwitterPicker } from 'react-color'
import { FormProvider, useForm } from 'react-hook-form'
import tinycolor from 'tinycolor2'
import { enum as oneOf, object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { ErrorMessage, Field, Label } from '@/components/primitives/Fieldset'
import { Input } from '@/components/primitives/Input'
import Select from '@/components/primitives/Select'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import DatasetTabArrayField from './DatasetTabArrayField'
import DecisionAppliedOnArrayField from './DecisionAppliedOnArrayField'

const schema = object({
  title: string().min(2).max(100),
  prompt: string().max(2000),
  output: object({
    type: oneOf(['boolean', 'group_value', 'group_value_list', 'number', 'number_list', 'text', 'timestamp']),
    format: oneOf(['currency', 'percent', 'decimal', ''])
      .transform((value) => (isEmpty(value) ? null : value))
      .nullable(),
    colorScheme: string()
      .refine((value) => tinycolor(value).isValid(), { message: 'Invalid CSS color' })
      .nullish(),
  }),
  datasets: object({
    id: string().uuid(),
    tab: object({
      slug: string().max(100).nonempty('Please select a tab'),
    }),
  }).array(),
  appliedOn: object({
    id: string().nonempty('Please select a computed column'),
    label: string().nullish(),
    type: string(),
    dataset: object({
      id: string().uuid(),
    }),
    tab: object({
      slug: string(),
    }).nullish(),
    replaceContent: string().max(2000).nullish(),
  })
    .array()
    .nullish(),
}).required()

const resolver = zodResolver(schema)

export type DecisionFormData = TypeOf<typeof schema>

interface Props {
  compileContext: IReportNodeCompileContext
  defaultValues?: DecisionFormData
  onCancel: () => void
  onSubmit: (data: DecisionFormData) => Promise<void>
  submitOnChange?: boolean
  values?: DecisionFormData
}

export default function DecisionForm({ defaultValues, compileContext, onCancel, onSubmit, values }: Props) {
  const methods = useForm({ defaultValues, resolver, values })
  const { formState, handleSubmit, watch } = methods
  const { errors, isSubmitting } = formState
  const [outputType] = watch(['output.type'])

  const submitForm = async (formValues: DecisionFormData) => {
    await onSubmit(formValues)
  }

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
        <Field>
          <Label htmlFor="name">Title</Label>
          <Input invalid={!!errors.title} type="text" {...methods.register('title')} />
          {errors.title && <ErrorMessage>{errors.title.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="prompt">Prompt</Label>
          <textarea
            {...methods.register('prompt')}
            className="block w-full resize-y rounded-lg border border-zinc-950/10 px-4 py-2 text-base/6 text-zinc-950 shadow placeholder:text-zinc-500 focus:ring-0 data-[hover]:border-zinc-950/20 sm:px-3 sm:text-sm/6 dark:border-white/10 dark:text-white dark:data-[hover]:border-white/20"
          ></textarea>
          {errors.prompt && <ErrorMessage>{errors.prompt.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="output.type">Output type</Label>
          <Select invalid={!!errors.output?.type} {...methods.register('output.type')}>
            {schema.shape.output.shape.type._def.values.map((value) => (
              <option key={value} value={value}>
                {startCase(value)}
              </option>
            ))}
          </Select>
        </Field>
        {outputType === 'number' || outputType == 'number_list' ? (
          <Field>
            <Label htmlFor="output.format">Output format</Label>
            <Select invalid={!!errors.output?.format} {...methods.register('output.format')}>
              {schema.shape.output.shape.format._def.innerType._def.schema._def.values.map((value) => (
                <option key={value} value={value}>
                  {isEmpty(value) ? 'No format' : startCase(value)}
                </option>
              ))}
            </Select>
            {errors.output?.format && <ErrorMessage>{errors.output?.format.message}</ErrorMessage>}
          </Field>
        ) : null}
        <Field>
          <Label htmlFor="color">Color scheme</Label>
          <TwitterPicker
            color={methods.watch('output.colorScheme') as string}
            onChange={(color) => methods.setValue('output.colorScheme', color.hex)}
            triangle="hide"
            width="100%"
          />
          {errors.output?.colorScheme && <ErrorMessage>{errors.output?.colorScheme?.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="datasets">Datasets</Label>
          <DatasetTabArrayField name="datasets" />
        </Field>
        <Field>
          <Label htmlFor="appliedOn">Applied on</Label>
          <DecisionAppliedOnArrayField name="appliedOn" reportId={compileContext.reportId} />
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
