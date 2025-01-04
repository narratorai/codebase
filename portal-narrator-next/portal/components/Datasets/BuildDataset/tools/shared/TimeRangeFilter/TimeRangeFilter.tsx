import { Input } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { semiBoldWeight } from 'util/constants'

import TimeFilterKindSelect from './TimeFilterKindSelect'
import TimeRangeValue from './TimeRangeValue'

interface Props {
  filterFieldName: string
  omitColumnIds?: string[]
}

const TimeRangeFilter = ({ filterFieldName, omitColumnIds }: Props) => {
  return (
    <>
      <Flex mt={1} alignItems="center">
        <Box width={40} mr={1} style={{ textAlign: 'right' }}>
          <Typography as="span" fontWeight={semiBoldWeight}>
            From
          </Typography>
        </Box>
        <Box>
          <Input.Group compact>
            <TimeFilterKindSelect rangeType="from" fieldName={`${filterFieldName}.from_type`} />
            <TimeRangeValue rangeType="from" filterFieldName={filterFieldName} omitColumnIds={omitColumnIds} />
          </Input.Group>
        </Box>
      </Flex>
      <Flex mt={1} alignItems="center">
        <Box width={40} mr={1} style={{ textAlign: 'right' }}>
          <Typography as="span" fontWeight={semiBoldWeight}>
            To
          </Typography>
        </Box>
        <Box>
          <Input.Group compact>
            <TimeFilterKindSelect rangeType="to" fieldName={`${filterFieldName}.to_type`} />
            <TimeRangeValue rangeType="to" filterFieldName={filterFieldName} omitColumnIds={omitColumnIds} />
          </Input.Group>
        </Box>
      </Flex>
    </>
  )
}

export default TimeRangeFilter
