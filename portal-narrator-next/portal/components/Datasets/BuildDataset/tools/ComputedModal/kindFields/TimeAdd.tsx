import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import {
  ColumnSelect,
  NumberField,
  TimeSegmentationSelect,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'
import { COLUMN_TYPE_TIMESTAMP } from 'util/datasets'

const TimeAdd = () => {
  return (
    <>
      <ColumnSelect
        columnTypes={[COLUMN_TYPE_TIMESTAMP]}
        labelText="Timestamp Column"
        placeholder="Select a timestamp column"
        defaultNthOptionWithFilter={{ index: 0 }}
      />

      <FormItem label="Time to add or subtract" layout="vertical" required>
        <Input.Group compact>
          <NumberField defaultValue={1} />
          <TimeSegmentationSelect defaultValue="day" plural />
        </Input.Group>
      </FormItem>
    </>
  )
}

export default TimeAdd
