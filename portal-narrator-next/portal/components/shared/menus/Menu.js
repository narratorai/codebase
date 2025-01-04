import React from 'react'
import styled from 'styled-components'
import { Menu as ContextMenu } from 'react-contexify'
import { colors } from 'util/constants'

const StyledMenu = styled(({ children, zIndex = 4, ...props }) => (
  <ContextMenu zIndex={zIndex} {...props}>
    {children}
  </ContextMenu>
))`
  background: ${colors.white} !important;
  border-radius: 4px;
  border: 1px solid ${colors.gray300};
  min-width: 166px;
  z-index: ${({ zIndex }) => zIndex};
`

const Menu = (props) => {
  return <StyledMenu {...props} />
}

export default Menu
