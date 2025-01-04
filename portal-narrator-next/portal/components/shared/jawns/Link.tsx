// This file was converted to TS in a hurry
// TODO cleanup and make sense of ILinkProps

import { useCompany } from 'components/context/company/hooks'
import * as H from 'history'
import _ from 'lodash'
import { Link as ReactRouterLink } from 'react-router-dom'
import { Link as RebassLink, LinkProps } from 'rebass'
import styled from 'styled-components'
import { typography } from 'util/constants'

import Box from './Box'
import Flex from './Flex'
import Icon from './Icon'

const RouterLink = styled(ReactRouterLink)`
  &:hover {
    text-decoration: none;
  }
`

const StyledLink = styled(({ noHoverUnderline, fontWeight, lineHeight, ...props }) => <RebassLink {...props} />)`
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  cursor: pointer;
  text-decoration: none;
  font-weight: ${(props) => props.theme.fontWeights[props.fontWeight]};
  line-height: ${(props) => props.lineHeight};
  display: ${(props) => (props.inline ? 'inline-block' : 'inherit')};

  &:hover {
    text-decoration: ${(props) => (props.noHoverUnderline ? 'none' : 'underline')};
  }

  &:visited {
    color: ${(props) => props.theme.colors[props.color]};
  }
`

interface IRenderIcon {
  svg: any
  size: string
  iconOnLeft?: boolean
  color?: string
}

const renderIcon = ({ svg, iconOnLeft, color, size }: IRenderIcon) => {
  if (svg) {
    const icon = <Icon svg={svg} color={color} width={size} height={size} />
    if (iconOnLeft) {
      return <Box mr="8px">{icon}</Box>
    }
    return <Box ml="8px">{icon}</Box>
  }
  return null
}

interface ILinkProps extends LinkProps {
  to?: string | H.LocationDescriptorObject
  target?: string
  svg?: any
  type?: string
  iconOnLeft?: boolean
  unstyled?: boolean
  color?: string
  inline?: boolean
  noHoverUnderline?: boolean
  fontWeight?: string
  rel?: string
  href?: string
  onClick?: any
  disabled?: boolean
  mr?: any
}

// href prop --> regular <a> link
// to prop --> react-router link
export const Link = ({ to, target, svg, type, iconOnLeft, unstyled = false, ...props }: ILinkProps) => {
  const company = useCompany()
  // Effectively using just react-router's Link with the companySlug automatically added:
  if (unstyled && to) {
    return (
      <RouterLink
        to={`/${company.slug}${to}`}
        target={target}
        {..._.omit(props, ['inline', 'noHoverUnderline', 'dispatch'])}
      />
    )
  }

  const fontSize = _.get(typography, `${type}.sizes`)
  const lineHeight = _.get(typography, `${type}.lineHeights`)
  const icon = renderIcon({ svg, iconOnLeft, color: props.color, size: fontSize })

  const link = to ? (
    <RouterLink to={`/${company.slug}${to}`} target={target}>
      <StyledLink as={Box} fontSize={fontSize} lineHeight={lineHeight} {...props} />
    </RouterLink>
  ) : (
    <StyledLink target={target} fontSize={fontSize} lineHeight={lineHeight} {...props} />
  )

  if (!icon) {
    return link
  }

  // NOTE, this means if you pass in an SVG it will render as a Flex block,
  // not inline-block like an <a> tag
  return (
    <Flex alignItems="center">
      {iconOnLeft && icon}
      {link}
      {!iconOnLeft && icon}
    </Flex>
  )
}

Link.defaultProps = {
  inline: false,
  color: 'blue500',
  type: 'body100',
  noHoverUnderline: false,
  fontWeight: 'normal',
  iconOnLeft: false,
}

export default Link
