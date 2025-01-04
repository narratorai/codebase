import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { map, truncate } from 'lodash'
import { semiBoldWeight } from 'util/constants'

export interface IOption {
  key: string
  label: string
  value: string
  columnType: string
  columnValues: { key: string; value: string }[]
  optGroupBy?: string
  extraSearchValues?: string
  disabled?: boolean
}

interface Props {
  option: IOption
  searchValue: string
}

const OptionContents = ({ option, searchValue }: Props) => (
  <Box py={1} mr={1}>
    <Flex justifyContent="space-between">
      <Box>
        <Typography fontWeight={semiBoldWeight}>
          <Mark value={option.label} snippet={searchValue} />
        </Typography>
      </Box>
      <Box pl={1}>
        <Typography type="body300" color="gray500">
          {option.columnType}
        </Typography>
      </Box>
    </Flex>
    {option.columnValues?.length > 0 && (
      <Box>
        {map(option.columnValues, (val) => (
          <Flex key={val.key} justifyContent="space-between" mt="4px">
            <Typography type="body300" title={val.key}>
              <Mark value={truncate(val.key, { length: 40 })} snippet={searchValue} />
            </Typography>
            <Typography type="body300">
              <Mark value={val.value} snippet={searchValue} />
            </Typography>
          </Flex>
        ))}
      </Box>
    )}
  </Box>
)

export default OptionContents
