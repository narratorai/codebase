import { WidgetProps } from '@rjsf/core'
import FieldsEditor from 'components/Fields/FieldsEditor'
import { get, isNumber } from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

// TODO: might want to make a common wrapper for editor widgets that handles options and other props uniformly
const WidgetWrapper = styled.div`
  border: 1px solid ${colors.gray400};
  border-radius: 3px;
`

interface FieldsWidgetProps extends WidgetProps {
  // options comes from ui:options in the uiSchema
  // it's already in WidgetProps but we redefine it here to make it more specific
  options: {
    default_height?: number
  }
}

const FieldsWidget: React.FC<FieldsWidgetProps> = ({ id, value, options, uiSchema, onBlur, onChange }) => {
  const defaultHeight = isNumber(options?.default_height) ? options?.default_height : 240
  const functionDefinitions = get(uiSchema, 'ui:options.function_autocomplete', [])

  const onBlurOverride = (value: string | undefined) => {
    onBlur && onBlur(id, value || null)
  }

  return (
    <WidgetWrapper>
      <FieldsEditor
        value={value}
        onChange={onChange}
        onBlur={onBlurOverride}
        functionDefinitions={functionDefinitions}
        defaultHeight={defaultHeight}
      />
    </WidgetWrapper>
  )
}

export default FieldsWidget
