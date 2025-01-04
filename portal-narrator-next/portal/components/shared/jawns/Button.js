import { useCompany } from 'components/context/company/hooks'
import { isFunction } from 'lodash'
import React from 'react'
import { Link as ReactRouterLink } from 'react-router-dom'
import { Button as RebassButton } from 'rebass'
import styled from 'styled-components'

import Flex from './Flex'
import Icon from './Icon'
import Link from './Link'

const StyledButton = styled(({ bgHover, bgActive, ...props }) => <RebassButton {...props} />)`
  margin: 0;
  display: flex;
  align-items: center;
  line-height: 1.23;
  border-radius: 4px;
  cursor: pointer;
  border: solid 1px transparent;
  font-weight: ${(props) => props.theme.fontWeights.semiBold};
  width: ${(props) => (props.fullWidth ? '100%' : 'initial')};

  &:hover {
    background-color: ${(props) => (props.bgHover ? props.theme.colors[props.bgHover] : props.theme.colors.blue600)};
    box-shadow: none;
  }

  &:active {
    background-color: ${(props) => (props.bgHover ? props.theme.colors[props.bgActive] : props.theme.colors.blue700)};
  }

  &:focus {
    box-shadow: none;
  }

  &:disabled {
    color: ${(props) => props.theme.colors.gray500};
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

const StyledLink = styled(Link)`
  &:hover {
    text-decoration: none;
  }
`

export const Button = ({ href, target, to, tiny, svg, renderIcon, children, ...props }) => {
  const company = useCompany()

  const InnerButton = (
    <StyledButton data-public px={props.px || tiny ? '8px' : '24px'} py="8px" fontSize={tiny ? 0 : 2} {...props}>
      {svg && (
        <Flex
          alignItems="center"
          style={{
            marginRight: !children ? 0 : tiny ? '4px' : '8px',
            width: tiny ? '8px' : '12px',
            // make 14px height instead of 12 to make icon match 32px height button!
            height: tiny ? '8px' : '14px',
          }}
        >
          <Icon
            svg={svg}
            color={props.disabled ? 'gray500' : props.color}
            width={tiny ? 8 : 12}
            height={tiny ? 8 : 12}
          />
        </Flex>
      )}
      {/* Remove this guy once we switch to using the svg instead of renderIcon everywhere */}
      {isFunction(renderIcon) && (
        <Flex
          alignItems="center"
          style={{
            marginRight: !children ? 0 : tiny ? '4px' : '8px',
            width: tiny ? '8px' : '12px',
            // make 14px height instead of 12 to make icon match 32px height button!
            height: tiny ? '8px' : '14px',
          }}
        >
          {renderIcon({
            color: props.disabled ? 'gray500' : props.color,
            width: tiny ? 8 : 12,
            height: tiny ? 8 : 12,
          })}
        </Flex>
      )}
      <span>{children}</span>
    </StyledButton>
  )

  if (to) {
    return <ButtonRouterLink to={`/${company.slug}${to}`}>{InnerButton}</ButtonRouterLink>
  }

  if (href) {
    return (
      <StyledLink href={href} target={target}>
        {InnerButton}
      </StyledLink>
    )
  }

  return InnerButton
}

const DefaultButton = (props) => {
  return <Button {...props} bg={props.bg || 'blue500'} color="blue100" />
}

export const ButtonSecondary = styled((props) => <Button bg="blue700" color="blue100" {...props} />)`
  &:hover {
    background-color: ${(props) => props.theme.colors.blue800};
  }

  &:active {
    background-color: ${(props) => props.theme.colors.blue600};
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray300};
  }
`

export const ButtonTertiary = styled(({ hoverColor, ...props }) => <Button {...props} />)`
  background: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors[props.color]};

  &:hover {
    background: ${(props) => props.theme.colors.white};
    color: ${(props) => props.theme.colors[props.hoverColor]};
    border: 1px solid ${(props) => props.theme.colors[props.hoverColor]};

    svg,
    use {
      fill: ${(props) => props.theme.colors[props.hoverColor]};
    }
  }

  &:active {
    background: ${(props) => props.theme.colors.white};
    color: ${(props) => props.theme.colors[props.activeColor]};
    border: 1px solid ${(props) => props.theme.colors[props.activeColor]};
  }

  &:disabled {
    color: ${(props) => props.theme.colors.gray500};
    background-color: ${(props) => props.theme.colors.gray300};
    border: 1px solid ${(props) => props.theme.colors.gray500};

    svg,
    use {
      fill: ${(props) => props.theme.colors.gray500};
    }
  }
`

ButtonTertiary.defaultProps = {
  color: 'blue900',
  hoverColor: 'blue800',
  activeColor: 'blue700',
}

export default DefaultButton
