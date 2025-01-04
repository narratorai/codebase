import React, { Component } from 'react'
import _ from 'lodash'
import styled from 'styled-components'
import PropTypes from 'prop-types'

// DUPLICATE OF StyledTextarea
export const StyledInput = styled(({ disabled, meta, carryRef, ...props }) => (
  <input ref={carryRef} disabled={disabled} {...props} />
))`
  width: 100%;
  background: ${(props) => props.theme.colors.white};
  font-size: ${(props) => props.theme.fontSizes[2]}px;
  border: 1px solid
    ${(props) =>
      _.get(props, 'meta.error') && _.get(props, 'meta.submitFailed')
        ? props.theme.colors.red500
        : props.theme.colors.gray400};
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

class Input extends Component {
  // Fix issue where we would hit the enter key and it would submit the form
  // https://github.com/davidkpiano/react-redux-form/issues/790
  handleKeyPress = (event) => {
    const { allowEnterToSubmit } = this.props
    if (allowEnterToSubmit) {
      return
    }
    if (event.key === 'Enter') event.preventDefault()
  }

  render() {
    const { allowEnterToSubmit, carryRef, ...otherProps } = this.props
    return <StyledInput f={1} onKeyPress={this.handleKeyPress} carryRef={carryRef} {...otherProps} />
  }
}

Input.propTypes = {
  allowEnterToSubmit: PropTypes.bool.isRequired,
}
Input.defaultProps = {
  allowEnterToSubmit: false,
}

export default Input
