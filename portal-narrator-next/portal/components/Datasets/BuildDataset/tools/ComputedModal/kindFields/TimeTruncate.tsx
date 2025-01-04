import { Input } from 'antd-next'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import {
  ColumnSelect,
  NumberField,
  TimeSegmentationSelect,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box } from 'components/shared/jawns'
import React from 'react'
import { COLUMN_TYPE_TIMESTAMP } from 'util/datasets'

const TimeTruncate = () => {
  return (
    <>
      <Title>Take values from</Title>

      <ColumnSelect
        columnTypes={[COLUMN_TYPE_TIMESTAMP]}
        labelText="Timestamp Column"
        placeholder="Select a timestamp column"
        defaultNthOptionWithFilter={{ index: 0 }}
      />

      <Title>And reduce to the nearest</Title>

      <Box mt={2}>
        <Input.Group compact>
          <NumberField fieldKey="resolution" defaultValue={1} />
          <TimeSegmentationSelect defaultValue="day" plural />
        </Input.Group>
      </Box>
    </>
  )
}

export default TimeTruncate
