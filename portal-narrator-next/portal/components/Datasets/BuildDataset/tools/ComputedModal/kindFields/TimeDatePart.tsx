import { FormItem } from 'components/antd/staged'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, TimeSegmentationSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'
import { COLUMN_TYPE_TIMESTAMP } from 'util/datasets'

const TimeDatePart = () => {
  return (
    <>
      <Title>Take values from</Title>

      <ColumnSelect
        columnTypes={[COLUMN_TYPE_TIMESTAMP]}
        labelText="Timestamp Column"
        placeholder="Select a timestamp column"
        defaultNthOptionWithFilter={{ index: 0 }}
      />

      <Title>and pick the date part that you'd like to output</Title>
      <FormItem label="Date part" layout="vertical" required>
        <TimeSegmentationSelect defaultValue="hour" isDatePart />
      </FormItem>
    </>
  )
}

export default TimeDatePart
