import { Box, Flex, Typography } from 'components/shared/jawns'
import styled from 'styled-components'
import { colors } from 'util/constants'

const ColorBadge = styled(Box)<{ color: string }>`
  height: 24px;
  width: 6px;
  background-color: ${(props) => props.color};
`

interface Props {
  name: string
  color?: string
  activityCount: number
}

const CategoryHeader = ({ name, color = colors.gray400, activityCount }: Props) => {
  return (
    <Flex alignItems="center">
      <ColorBadge color={color} mr={1} />
      <Typography type="title500" style={{ fontWeight: 300 }}>{`${name} (${activityCount})`}</Typography>
    </Flex>
  )
}

export default CategoryHeader
