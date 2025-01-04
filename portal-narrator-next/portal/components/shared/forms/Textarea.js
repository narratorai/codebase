import React, { Component } from 'react'
import styled from 'styled-components'

// DUPLICATE OF StyledInput
export const StyledTextarea = styled(({ disabled, ...props }) => <textarea disabled={disabled} {...props} />)`
  width: 100%;

  /* SPECIFICALLY FOR TEXTAREAS: */
  box-sizing: border-box;
  resize: ${(props) => props.resize};
  background: ${(props) => props.theme.colors.white};
  font-size: ${(props) => props.theme.fontSizes[2]}px;
  border: 1px solid ${(props) => props.theme.colors.gray400};
  border-radius: 4px;
  line-height: 1.23;
  padding: 10px;

  &:hover,
  &:focus {
    &:not(:disabled) {
      cursor: pointer;
      border: 1px solid ${(props) => props.theme.colors.blue300};
      box-shadow: none;
    }
  }

  /* stylelint-disable-next-line no-descending-specificity */
  &:disabled {
    background: ${(props) => props.theme.colors.gray100};
    opacity: 1;

    &:hover {
      cursor: not-allowed;
    }
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.gray500};
  }
`

class Textarea extends Component {
  render() {
    return <StyledTextarea {...this.props} />
  }
}

Textarea.defaultProps = {
  resize: 'none',
}

export default Textarea
