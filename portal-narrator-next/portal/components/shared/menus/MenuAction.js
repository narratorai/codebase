import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { Flex, Box, Text } from 'components/shared/jawns'
import Plus from 'components/shared/icons/Plus'

const StyledMenuAction = styled(({ disabled, remove, plus, text, ...props }) => (
  <Flex alignItems="center" {...props}>
    {remove || !plus ? null : <Plus color="blue500" />}
    <Box ml="16px">
      <Text color={remove ? colors.red500 : colors.blue500}>{text}</Text>
    </Box>
  </Flex>
))`
  font-weight: 600 !important;
`

const MenuAction = (props) => <StyledMenuAction {...props} />

MenuAction.defaultProps = {
  plus: true,
}

export default MenuAction
