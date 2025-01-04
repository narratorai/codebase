import React from 'react'
import styled from 'styled-components'
import { Link as RebassLink } from 'rebass'
import { NavLink as ReactRouterNavLink } from 'react-router-dom'
import { useCompany } from 'components/context/company/hooks'

const StyleReactRouterNavLink = styled(ReactRouterNavLink)`
  margin-left: 16px;

  &:hover {
    text-decoration: none;
  }

  /* subtract 2 from bottom padding to make up for border */
  &.active {
    font-weight: ${(props) => props.theme.fontWeights.bold};
    border-bottom: 2px solid ${(props) => props.theme.colors.red600};

    .child-link {
      padding-bottom: 22px;
    }
  }
`

const StyleNavLink = styled(RebassLink)`
  color: black !important;
  padding: 24px 8px;
  font-weight: ${(props) => props.theme.fontWeights.semiBold};
  font-size: ${(props) => props.theme.fontSizes[3]}px;

  &:hover {
    background: transparent;
    text-decoration: none;
  }
`

// href prop --> regular <a> link
// to prop --> react-router link
export const NavLink = ({ to, location, target, ...props }) => {
  const company = useCompany()

  if (to) {
    return (
      <StyleReactRouterNavLink to={`/${company.slug}${to}`} location={location} target={target}>
        <StyleNavLink as="div" className="child-link" {...props} />
      </StyleReactRouterNavLink>
    )
  }

  return <StyleNavLink target={target} {...props} />
}

export default NavLink
