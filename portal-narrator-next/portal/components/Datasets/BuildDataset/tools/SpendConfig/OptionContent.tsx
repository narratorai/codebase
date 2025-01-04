import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { semiBoldWeight } from 'util/constants'

interface Props {
  column: any
  searchValue: string
}

const OptionContent = ({ column, searchValue }: Props) => (
  <Flex justifyContent="space-between" alignItems="center" style={{ minWidth: 280 }}>
    <Box>
      <Typography fontWeight={semiBoldWeight}>
        <Mark value={column?.label} snippet={searchValue} />
      </Typography>
    </Box>
    <Box pl={1}>
      <Typography type="body300" color="gray500">
        {column?.type}
      </Typography>
    </Box>
  </Flex>
)

export default OptionContent
