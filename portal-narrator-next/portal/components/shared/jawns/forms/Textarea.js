import React, { Component } from 'react'
import styled from 'styled-components'

import { inputStyle, renameStyle } from './Input'

export const StyledTextarea = styled(({ disabled, ...props }) => <textarea disabled={disabled} {...props} />)`
  width: 100%;

  /* SPECIFICALLY FOR TEXTAREAS: */
  box-sizing: border-box;
  resize: ${(props) => props.resize};

  ${inputStyle}
`

export const RenameTextarea = styled(({ fontSize, ...props }) => <textarea {...props} />)`
  ${renameStyle}

  /* SPECIFICALLY FOR TEXTAREAS: */
  box-sizing: border-box;
  resize: ${(props) => props.resize};
`

RenameTextarea.defaultProps = {
  fontSize: 2,
}

class Textarea extends Component {
  render() {
    return <StyledTextarea {...this.props} />
  }
}

Textarea.defaultProps = {
  resize: 'none',
  rows: 3,
}

export default Textarea
