import { zodResolver } from '@hookform/resolvers/zod'
import { startCase } from 'lodash'
import { FormProvider, useForm } from 'react-hook-form'
import { enum as oneOf, object, string, TypeOf } from 'zod'

import { Button } from '@/components/primitives/Button'
import { ErrorMessage, Field, Label } from '@/components/primitives/Fieldset'
import { Input } from '@/components/primitives/Input'
import Select from '@/components/primitives/Select'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import DatasetColumnMultiSelect, { SelectionItem } from './DatasetColumnMultiSelect'

const schema = object({
  name: string().max(100),
  type: oneOf(['json', 'string', 'timestamp', 'number', 'boolean']),
  operator: oneOf([
    // Common operators
    'equal',
    'not_equal',

    // Number, string (?) and time operators
    'greater_than',
    'less_than',
    'greater_than_equal',
    'less_than_equal',

    // Time operators
    'time_range',

    // Time reference operators
    'relative',
    'absolute',
    'start_of',

    // String operators
    'contains',
    'not_contains',
    'starts_with',
    'not_starts_with',
    'ends_with',
    'not_ends_with',

    // Null operators
    'is_null',
    'not_is_null',
    'is_empty',
    'not_is_empty',

    // Array operators
    'is_in',
    'not_is_in',

    // String array operators
    'contains_any',
    'not_contains_any',
  ]),
  defaultValue: string().max(200),
  applyOn: object({
    id: string(),
    label: string().nullish(),
    type: string(),
    dataset: object({
      id: string().uuid(),
    }),
    tab: object({
      slug: string(),
    }).nullish(),
  }).array(),
}).required()

const resolver = zodResolver(schema)

export type FilterFormData = TypeOf<typeof schema>

function getTypeFromType(type?: FilterFormData['type']) {
  switch (type) {
    case 'timestamp':
      return 'datetime-local'
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    default:
      return 'text'
  }
}

interface Props {
  compileContext: IReportNodeCompileContext
  defaultValues?: FilterFormData
  onCancel: () => void
  onSubmit: (data: FilterFormData) => Promise<void>
  submitOnChange?: boolean
  values?: FilterFormData
}

export default function FilterForm({ compileContext, defaultValues, onCancel, onSubmit, values }: Props) {
  const methods = useForm({ defaultValues, resolver, values })
  const { formState, handleSubmit, watch } = methods
  const { errors, isSubmitting } = formState
  const [type, applyOn] = watch(['type', 'applyOn'])

  const submitForm = async (formValues: FilterFormData) => {
    await onSubmit(formValues)
  }

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
        <Field>
          <Label htmlFor="name">Name</Label>
          <Input invalid={!!errors.name} type="text" {...methods.register('name')} />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="applyOn">Dataset columns</Label>
          <DatasetColumnMultiSelect
            name="applyOn"
            onChange={(value) => {
              methods.setValue('applyOn', value)
              methods.setValue('type', value[0]?.type)
            }}
            reportId={compileContext.reportId}
            value={applyOn as SelectionItem[]}
          />
        </Field>
        <Field>
          <Label htmlFor="operator">Operator</Label>
          <Select {...methods.register('operator')}>
            {schema.shape.operator._def.values.map((value) => (
              <option key={value} value={value}>
                {startCase(value)}
              </option>
            ))}
          </Select>
          {errors.operator && <ErrorMessage>{errors.operator.message}</ErrorMessage>}
        </Field>
        <Field>
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input invalid={!!errors.defaultValue} type={getTypeFromType(type)} {...methods.register('defaultValue')} />
          {errors.defaultValue && <ErrorMessage>{errors.defaultValue.message}</ErrorMessage>}
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
