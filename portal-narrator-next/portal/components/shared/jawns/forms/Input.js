import React, { Component } from 'react'
import _ from 'lodash'
import styled, { css } from 'styled-components'
import PropTypes from 'prop-types'

export const inputStyle = css`
  background-color: ${(props) => props.theme.colors.white};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  color: ${(props) => props.theme.colors.blue900};
  border: 1px solid
    ${(props) =>
      _.get(props, 'meta.error') && (_.get(props, 'meta.touched') || _.get(props, 'meta.dirty'))
        ? props.theme.colors.red500
        : props.theme.colors.blue700};
  border-radius: 4px;
  line-height: 1.43;
  padding: 10px 16px;

  &:focus {
    background-color: ${(props) => props.theme.colors.blue100};
    border-color: ${(props) => props.theme.colors.blue600};
    outline: none;
  }

  &:disabled {
    border-color: ${(props) => props.theme.colors.gray400};

    &:hover {
      cursor: not-allowed;
    }
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.gray400};
  }
`

export const renameStyle = css`
  box-shadow: 0 0 0 1px inset
    ${(props) => (_.get(props, 'meta.error') ? props.theme.colors.red500 : props.theme.colors.gray300)};
  width: 100%;
  background-color: ${(props) => props.theme.colors.white};
  font-size: ${(props) => props.theme.fontSizes[props.fontSize]}px;

  &:focus {
    outline: ${(props) => (_.get(props, 'meta.error') ? 'none' : 'auto')};
  }
`

////////// BASIC INPUT FOR RENAME ONLY //////////

export const RenameInput = styled(({ fontSize, ...props }) => <input {...props} autoComplete="off" />)`
  ${renameStyle}
`

RenameInput.defaultProps = {
  fontSize: 2,
}

////////// UNIVERSAL INPUT COMPONENT //////////

export const StyledInput = styled(({ disabled, meta, carryRef, ...props }) => (
  <input ref={carryRef} disabled={disabled} {...props} />
))`
  width: 100%;
  background-color: ${(props) => props.theme.colors.white};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  color: ${(props) => props.theme.colors.blue900};
  border: 1px solid
    ${(props) =>
      _.get(props, 'meta.error') && (_.get(props, 'meta.touched') || _.get(props, 'meta.dirty'))
        ? props.theme.colors.red500
        : props.theme.colors.blue700};
  border-radius: 4px;
  line-height: 1.43;
  padding: 10px 16px;

  &:focus {
    background-color: ${(props) => props.theme.colors.blue100};
    border-color: ${(props) => props.theme.colors.blue600};
    outline: none;
  }

  &:disabled {
    border-color: ${(props) => props.theme.colors.gray400};

    &:hover {
      cursor: not-allowed;
    }
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.gray400};
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
    return <StyledInput onKeyPress={this.handleKeyPress} carryRef={carryRef} {...otherProps} />
  }
}

Input.propTypes = {
  allowEnterToSubmit: PropTypes.bool.isRequired,
}
Input.defaultProps = {
  allowEnterToSubmit: true,
}

export default Input
