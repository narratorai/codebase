import { Box, Typography } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'

import BasicEditorWidget, { BasicEditorWidgetProps } from './BasicEditorWidget'

const InputWrapper = styled(Box)<{ error: boolean }>`
  height: 100%;
  position: relative;
  border: ${(props) => (props.error ? `1px solid ${props.theme.colors.red500}` : 'none')};
`

const ErrorWrapper = styled(Box)`
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 1;
`

export interface Props extends BasicEditorWidgetProps {
  meta?: any
  measureRef?: any
}

/**
 * This is a basic editor field. It's the base component for
 * MarkdownField and JsonField and can also be used directly
 */
const BasicEditorField = ({ meta, measureRef, options, ...props }: Props) => {
  const hasError = (meta?.error || meta?.submitError) && meta?.touched

  return (
    <div style={{ height: '100%', position: 'relative' }} ref={measureRef}>
      {hasError && (
        <ErrorWrapper>
          <Typography type="body100" color="red500" mb="8px">
            Required
          </Typography>
        </ErrorWrapper>
      )}

      <InputWrapper error={hasError}>
        <BasicEditorWidget options={options} {...props} />
      </InputWrapper>
    </div>
  )
}

export default BasicEditorField
