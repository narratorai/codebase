import { Box } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'
import { breakpoints } from 'util/constants'

const StyledBox = styled(Box)`
  @media only screen and (max-width: ${breakpoints.md}) {
    display: none;
  }
`

const XlBox = styled(Box)`
  @media only screen and (max-width: ${breakpoints.lg}) {
    display: none;
  }
`

const LargeScreenOnly = ({ ...props }) => {
  return <StyledBox {...props}>{props.children}</StyledBox>
}

export const ExtraLargeScreenOnly = ({ ...props }) => {
  return <XlBox {...props}>{props.children}</XlBox>
}

export default LargeScreenOnly
