import React from 'react'
import { Box as RebassBox, BoxProps as RebassBoxProps } from 'rebass'
import styled from 'styled-components'

// Monkeypatch Rebass <Box> component to allow flex-grow, max-width, and to filter out some extraneous props that try to get into it
const StyledBox = styled(
  ({ flexGrow, maxWidth, minWidth, relative, onItemHover, onOpenChange, onDeselect, ...props }) => (
    <RebassBox {...props} />
  )
)`
  position: ${(props) => (props.relative ? 'relative' : 'initial')};

  /* FIXME/monkeypatch - rebass 3 only supports width on the width= prop, NOT the w= prop */
  width: ${({ w, width }) => (w ? w : width || 'initial')};
  flex-grow: ${({ flexGrow }) => (flexGrow ? flexGrow : 'initial')};
  max-width: ${({ maxWidth }) => (maxWidth ? maxWidth : 'initial')};
  min-width: ${({ minWidth }) => (minWidth ? minWidth : 'initial')};
`

export interface BoxProps extends RebassBoxProps {
  relative?: boolean
  flexGrow?: number
}

const Box = ({ children, relative = false, ...props }: BoxProps) => (
  <StyledBox relative={relative} {...props}>
    {children}
  </StyledBox>
)

export default Box
