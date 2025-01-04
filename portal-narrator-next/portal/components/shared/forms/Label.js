import React from 'react'
import styled from 'styled-components'

const StyledLabel = styled(({ disabled, inline, large, strong, text, ...props }) => (
  <label disabled={disabled} {...props}>
    {text}
  </label>
))`
  display: inline-block;
  font-size: ${(props) => (props.large ? `${props.theme.fontSizes[1]}px` : `${props.theme.fontSizes[0]}px`)};
  color: ${(props) => (props.disabled ? props.theme.colors.gray500 : props.theme.colors.gray700)};
  line-height: 1.27;
  margin-bottom: ${(props) => (props.inline ? '0px' : '7px')};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  font-weight: ${(props) => (props.strong ? 600 : 300)};
`

const Label = (props) => <StyledLabel {...props} />

export default Label
