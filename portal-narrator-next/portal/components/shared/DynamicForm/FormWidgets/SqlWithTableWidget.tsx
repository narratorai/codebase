import { WidgetProps } from '@rjsf/core'
import { FullscreenEditor, SqlEditor, useSqlAutocomplete } from 'components/shared/SqlEditor'
import _ from 'lodash'
import { useRef } from 'react'
import styled from 'styled-components'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'
import { colors } from 'util/constants'

const WidgetWrapper = styled.div`
  border: 1px solid ${colors.gray400};
  border-radius: 3px;
`

const SqlWithTableWidget = (props: WidgetProps) => {
  const valueRef = useRef<() => any | undefined>()

  const { id, formContext, options, onChange, value, uiSchema } = props
  const fields = _.get(uiSchema, 'ui:options.fields', null) // fields (with values) that must be sent to Mavis
  const autocompleteFields = _.get(uiSchema, 'ui:options.fields_autocomplete', []) // field names available to autocomplete
  const autocomplete = useSqlAutocomplete(autocompleteFields)

  const updateValue = () => {
    if (valueRef.current) {
      const editorValue = valueRef.current()
      onChange(editorValue)
      // Handle options.process_data and options.update_schema
      triggerSchemaAndDataUpdates(formContext, options, id)
    }
  }

  if (!autocomplete) {
    return null
  }

  return (
    <WidgetWrapper>
      <FullscreenEditor
        EditorComponent={SqlEditor}
        onEditorSave={updateValue}
        onClose={updateValue}
        initialEditorData={value ? _.toString(value) : ''}
        getValueRef={valueRef}
        autoComplete={autocomplete}
        editorContext={{ fields: fields }}
      />
    </WidgetWrapper>
  )
}

export default SqlWithTableWidget
