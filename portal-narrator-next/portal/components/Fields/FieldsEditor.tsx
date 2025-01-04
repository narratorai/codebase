import { BasicEditor } from '@narratorai/the-sequel'
import React from 'react'

import { FunctionDefinition } from './FieldsCompletionService'
import useFieldsAutocomplete from './useFieldsAutocomplete'

interface Props {
  value: string
  onChange: (value: string | undefined) => void
  onBlur?: (value: any) => void
  functionDefinitions: FunctionDefinition[]
  defaultHeight?: number
}

const FieldsEditor = ({ value, onChange, onBlur, functionDefinitions, defaultHeight = 600 }: Props) => {
  const autocomplete = useFieldsAutocomplete(functionDefinitions)
  return (
    <BasicEditor
      language="python"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoComplete={autocomplete}
      height={defaultHeight}
    />
  )
}

export default FieldsEditor
