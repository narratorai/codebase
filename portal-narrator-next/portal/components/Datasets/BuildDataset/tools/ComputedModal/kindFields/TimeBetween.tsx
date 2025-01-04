import { FormItem } from 'components/antd/staged'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, TimeSegmentationSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex, Typography } from 'components/shared/jawns'
import React from 'react'
import { COLUMN_TYPE_TIMESTAMP } from 'util/datasets'

const TimeBetween = () => {
  return (
    <>
      <Title>Calculate time between</Title>

      <Flex alignItems="center" flexWrap="wrap">
        <Box width="45%" style={{ minWidth: 140 }}>
          <ColumnSelect
            columnTypes={[COLUMN_TYPE_TIMESTAMP]}
            placeholder="Timestamp column"
            labelText="Time starting point"
            defaultNthOptionWithFilter={{ index: 0 }}
          />
        </Box>
        <Box px="6px">
          <Typography>and</Typography>
        </Box>
        <Box width="45%" style={{ minWidth: 140 }}>
          <ColumnSelect
            columnTypes={[COLUMN_TYPE_TIMESTAMP]}
            fieldKey="second_column_id"
            placeholder="Timestamp column"
            labelText="Time ending point"
            defaultNthOptionWithFilter={{ index: 1 }}
          />
        </Box>
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

export default TimeBetween
