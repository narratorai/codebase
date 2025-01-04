import React from 'react'
import { transparentize } from 'polished'

import { Box, Flex, Typography } from 'components/shared/jawns'
import { colors, semiBoldWeight } from 'util/constants'

export const CellHeader = ({ width, title }) => {
  return (
    <Flex alignItems="center" width={width} bg="gray200" pl="16px" mr="1px" css={{ height: '48px' }}>
      <Typography type="body100" color="blue900" fontWeight={semiBoldWeight}>
        {title}
      </Typography>
    </Flex>
  )
}

export const Cell = ({ index, width = 1, ...props }) => {
  const transparency = index % 2 === 0 ? '0' : '0.5'
  return <Box width={width} bg={transparentize(transparency, colors.gray100)} py="12px" pl="16px" mr="1px" {...props} />
}
