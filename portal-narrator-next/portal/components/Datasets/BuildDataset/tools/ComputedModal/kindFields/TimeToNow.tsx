import { FormItem } from 'components/antd/staged'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, TimeSegmentationSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex, Typography } from 'components/shared/jawns'
import React from 'react'
import { COLUMN_TYPE_TIMESTAMP } from 'util/datasets'

const TimeToNow = () => {
  return (
    <>
      <Title>Calculate time from</Title>

      <Flex alignItems="center">
        <Box width="45%" mr={1}>
          <ColumnSelect
            columnTypes={[COLUMN_TYPE_TIMESTAMP]}
            placeholder="Timestamp column"
            labelText="Time starting point"
            defaultNthOptionWithFilter={{ index: 0 }}
          />
        </Box>
        <Typography>to now</Typography>
      </Flex>

      <Title>and output the difference in</Title>

      <Box width={1 / 2}>
        <FormItem label="Time Resolution" layout="vertical" required>
          <TimeSegmentationSelect defaultValue="day" plural />
        </FormItem>
      </Box>
    </>
  )
}

export default TimeToNow
