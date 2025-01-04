import React from 'react'
import styled from 'styled-components'
import { Button as RebassButton } from 'rebass'
import { Link as ReactRouterLink } from 'react-router-dom'

const StyledButton = styled(RebassButton)`
  display: flex;
  align-items: center;
  line-height: 1.23;
  border-radius: 4px;
  cursor: pointer;
  border: solid 1px transparent;
  font-weight: 600;
  width: ${(props) => (props.fullWidth ? '100%' : 'inherit')};

  &:hover {
    background-color: ${(props) => props.theme.colors.blue600};
    box-shadow: none;
  }

  &:active {
    box-shadow: inset 0 0 8px rgb(0 0 0 / 50%) !important;
  }

  &:focus {
    box-shadow: none;
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray300};
    opacity: 1;

    &:active {
      box-shadow: none !important;
    }

    &:hover {
      cursor: not-allowed;
    }
  }

  /* Center children by default (for Router button or reg button) */
  span {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`

const ButtonRouterLink = styled(ReactRouterLink)`
  &:hover {
    text-decoration: none;
  }
`

export const Button = ({ to, icon, children, ...props }) => {
  const InnerButton = (
    <StyledButton px={icon ? '12px' : '30px'} py={icon ? '8px' : '10px'} {...props}>
      <span>{children}</span>
    </StyledButton>
  )

  if (to) {
    return <ButtonRouterLink to={to}>{InnerButton}</ButtonRouterLink>
  }

  return InnerButton
}

Button.defaultProps = {
  fontSize: 2,
}

// Export StyledButton to extend in other styled component parents (check MetricTab.js)
export { StyledButton }

const DefaultButton = (props) => {
  return <Button {...props} bg="blue500" />
}

export const ButtonLight = styled(({ noBorder, ...rest }) => <Button bg="blue100" color="blue500" {...rest} />)`
  border: ${(props) => (props.noBorder ? 'solid 1px transparent' : 'solid 1px ' + props.theme.colors.blue300)};

  &:hover {
    background-color: ${(props) => props.theme.colors.blue200};
  }

  &:active {
    box-shadow: inset 0 0 8px rgb(0 0 0 / 25%) !important;
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray100};
    border: solid 1px ${(props) => props.theme.colors.gray300};
    color: ${(props) => props.theme.colors.gray300};
  }
`

export const ButtonDanger = styled(({ noBorder, ...rest }) => <Button bg="red500" {...rest} />)`
  &:hover {
    background-color: ${(props) => props.theme.colors.red600};
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray100};
    border: solid 1px ${(props) => props.theme.colors.gray300};
    color: ${(props) => props.theme.colors.gray300};
  }
`

export const ButtonTimid = styled(({ noBorder, ...rest }) => <Button bg="gray100" color="black" {...rest} />)`
  border: solid 1px ${(props) => props.theme.colors.gray400};

  &:hover {
    background-color: ${(props) => props.theme.colors.gray200};
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray100};
    border: solid 1px ${(props) => props.theme.colors.gray300};
    color: ${(props) => props.theme.colors.gray300};
  }
`

const StyledButtonTransparent = styled(Button)`
  background: transparent;
  border: 1px solid transparent;

  &:hover {
    background-color: transparent;
    box-shadow: none;
    text-decoration: underline;
  }

  &:active {
    box-shadow: none !important;
  }

  &:focus {
    border: 1px solid transparent;
  }

  &:disabled {
    background-color: transparent;
    color: ${(props) => props.theme.colors.gray300};

    &:hover {
      text-decoration: none;
    }
  }
`

export const ButtonTransparent = (props) => {
  return <StyledButtonTransparent {...props} color="blue500" />
}

export default DefaultButton
