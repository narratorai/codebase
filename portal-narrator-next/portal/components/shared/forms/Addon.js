import React, { Component } from 'react'
import styled from 'styled-components'

export const StyledAddon = styled(({ content, disabled, left, ...props }) => (
  <div {...props}>
    <span>{content}</span>
  </div>
))`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${(props) => props.theme.colors.gray300};
  border-right-width: ${(props) => (props.left ? '0px' : '1px')};
  border-left-width: ${(props) => (props.left ? '1px' : '0px')};
  background: ${(props) => (props.disabled ? props.theme.colors.gray100 : props.theme.colors.white)};

  &:hover,
  &:focus {
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    border: 1px solid ${(props) => (props.disabled ? 'inherit' : props.theme.colors.blue300)};
    border-right-width: ${(props) => (props.left ? '0px' : '1px')};
    border-left-width: ${(props) => (props.left ? '1px' : '0px')};
  }

  > span {
    max-height: 16px;
  }

  svg,
  use {
    fill: ${(props) => (props.disabled ? props.theme.colors.gray300 : 'auto')};
  }
`

class Addon extends Component {
  handleClick = () => {
    const { disabled, onClick } = this.props

    if (disabled) {
      return true
    }

    if (onClick) {
      return onClick()
    }
  }

  render() {
    const { onClick, ...rest } = this.props

    return <StyledAddon onClick={this.handleClick} {...rest} />
  }
}

Addon.propTypes = {}

export default Addon
