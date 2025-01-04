import { Button, Divider, Flex } from 'antd-next'
import { DynamicFieldReturn } from 'components/Narratives/interfaces'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import DynamicField, { MULTIPLE_DROPDOWN_TYPES } from 'components/Narratives/Narrative/DynamicFields/DynamicField'
import { Box } from 'components/shared/jawns'
import { each, includes, isEmpty, map } from 'lodash'
import { useContext, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

interface Props {
  onSubmit: (data: any) => void
}

interface DynamicFieldWithValue extends DynamicFieldReturn {
  value: string | Record<string, any> | string[] | null
}

interface FormState {
  fields: DynamicFieldWithValue[]
}

const DynamicFieldsForm = ({ onSubmit: onSubmitFilters }: Props) => {
  const { selectedDynamicFields, analysisData } = useContext(AnalysisContext)
  const availableDynamicFields = analysisData?.dynamic_fields

  const initialValues = useMemo(() => {
    return map(availableDynamicFields, (dynamicField) => {
      // make sure that falsy default values fit the multi vs single structure
      const isMultiSelect = includes(MULTIPLE_DROPDOWN_TYPES, dynamicField.value_type)
      const defaultEmptyValue = isMultiSelect ? [] : null

      // apply defaultEmptyValue to empty default values (make sure they are the right data structure: [] vs null)
      const safeDefaultValue = isEmpty(dynamicField.default_value) ? defaultEmptyValue : dynamicField.default_value
      const value = selectedDynamicFields?.[dynamicField.name]

      return {
        ...dynamicField,
        // if their are values from url param - use those
        // otherwise use the field's default value
        value: isEmpty(value) ? safeDefaultValue : value,
      }
    })
  }, [availableDynamicFields, selectedDynamicFields])

  const methods = useForm<FormState>({
    defaultValues: { fields: initialValues },
    mode: 'all',
  })

  const {
    handleSubmit,
    formState: { isValid },
    reset,
    watch,
  } = methods

  const onSubmit = handleSubmit((formValue: FormState) => {
    const formattedFieldValues: Record<string, string | Record<string, any> | string[] | null> = {}
    each(formValue.fields, (field) => {
      formattedFieldValues[field.name] = field.value
    })

    onSubmitFilters(formattedFieldValues)
  })

  const onClear = () => {
    const clearedValues = map(availableDynamicFields, (dynamicField) => {
      const isMultiSelect = includes(MULTIPLE_DROPDOWN_TYPES, dynamicField.value_type)
      const defaultEmptyValue = isMultiSelect ? [] : null

      return {
        ...dynamicField,
        value: defaultEmptyValue,
      }
    })

    reset({ fields: clearedValues })
  }

  const fieldValues = watch('fields')

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Box style={{ height: '100%', overflowY: 'auto' }}>
          {map(fieldValues, (field, idx) => (
            <Box mr={1}>
              <DynamicField key={field.name} fieldName={`fields.${idx}`} />
            </Box>
          ))}
        </Box>
        <Divider />
        <Flex gap={16} justify="flex-end">
          <Button onClick={onClear}>Clear</Button>
          <Button type="primary" onClick={onSubmit} disabled={!isValid}>
            Submit
          </Button>
        </Flex>
      </form>
    </FormProvider>
  )
}

export default DynamicFieldsForm
