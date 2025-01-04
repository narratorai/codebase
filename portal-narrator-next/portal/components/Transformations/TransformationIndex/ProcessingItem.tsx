import { Popover } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

const ProcessingItemHover = styled(Box)`
  &:hover {
    cursor: pointer;
    color: ${colors.gray500};
  }
`

interface Props {
  text: string
  hoverContent?: string | React.ReactElement
  withComma?: boolean
}

const ProcessingItem = ({ text, hoverContent, withComma }: Props) => {
  if (!hoverContent) {
    return (
      <Typography>
        {text}
        {withComma && ','}
      </Typography>
    )
  }

  return (
    <Popover content={hoverContent} placement="left">
      <ProcessingItemHover>
        {text}
        {withComma && ','}
      </ProcessingItemHover>
    </Popover>
  )
}

export default ProcessingItem
