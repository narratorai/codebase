import React, { ReactNode } from 'react'
import { semiBoldWeight } from 'util/constants'

import Flex from './Flex'
import Typography from './Typography'

interface Props {
  children: ReactNode
  bg?: string
  textColor?: string
}

const Tag = ({ bg = 'gray400', children, textColor = 'blue800' }: Props) => {
  return (
    <Flex
      px="16px"
      py="2px"
      mr="16px"
      bg={bg}
      css={{ borderRadius: '12px' }}
      justifyContent="center"
      alignItems="center"
    >
      <Typography type="body300" fontWeight={semiBoldWeight} color={textColor}>
        {children}
      </Typography>
    </Flex>
  )
}

export default Tag
