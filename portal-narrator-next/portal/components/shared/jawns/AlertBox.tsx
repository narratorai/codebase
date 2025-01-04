import React from 'react'
import styled from 'styled-components'

import Box from './Box'
import Typography from './Typography'

interface IColorMapping {
  [key: string]: string
}

interface AlertBoxProps {
  children: any
  kind: 'info' | 'success' | 'warn' | 'error'
  title?: string
}

const colorMapping: IColorMapping = {
  info: 'gray200',
  success: 'green200',
  warn: 'yellow100',
  error: 'red200',
}

const StyledBox = styled(Box)`
  color: rgb(0 0 0 / 65%);
  background-color: ${(props) => props.theme.colors[colorMapping[props.kind as string]]};
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 10%);
`

const AlertBox: React.FC<AlertBoxProps> = ({ kind = 'info', children, title }) => (
  <StyledBox p={1} kind={kind}>
    {title && (
      <Typography type="title400" mb="4px">
        {title}
      </Typography>
    )}
    {children}
  </StyledBox>
)

export default AlertBox
