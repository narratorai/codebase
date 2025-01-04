import { FieldProps } from '@rjsf/core'
import { FullscreenEditor, useSqlAutocomplete } from 'components/shared/SqlEditor'
import { get } from 'lodash'
import { useRef } from 'react'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'

import QueryWithScratchpadEditor from './QueryWithScratchPadEditor'

interface Props extends Omit<FieldProps, 'formData'> {
  formData?: {
    field_slug: string
    current_query: {
      id: string
      sql: string
    }
    scratchpad: {
      id: string
      notes: string
    }
  }
}

const QueryWithScratchpadField = ({ formContext, onChange, formData, uiSchema }: Props) => {
  const valueRef = useRef<() => string | undefined>()

  const options = get(uiSchema, 'ui:options', {})
  const autocompleteFields = get(uiSchema, 'ui:options.fields_autocomplete', []).concat([
    {
      name: 'current_script',
      description: "The current transformation SQL you're working on right now",
      display_name: 'current_script',
      sql: 'current_script',
    },
  ])

  const autoComplete = useSqlAutocomplete(autocompleteFields)

  // onChange isn't called on every user input -- instead we call it
  // when the opens, closes, or saves the form
  const updateChanged = () => {
    if (valueRef.current) {
      const currentValue = valueRef.current()
      onChange(currentValue)
    }
  }

  const handleSave = () => {
    if (formData) {
      triggerSchemaAndDataUpdates(formContext, { ...options, process_data: true }, formData?.field_slug)
      updateChanged()
    }
  }

  if (!autoComplete || !formData) {
    return null
  }

  return (
    <FullscreenEditor
      autoComplete={autoComplete}
      EditorComponent={QueryWithScratchpadEditor}
      onEditorSave={handleSave}
      onClose={updateChanged} // updateChanged so that editor updates get persisted
      onOpen={updateChanged} // updateChanged so that the form becomes dirty: we won't call onChange as the user types
      initialEditorData={formData}
      getValueRef={valueRef}
    />
  )
}

export default QueryWithScratchpadField
