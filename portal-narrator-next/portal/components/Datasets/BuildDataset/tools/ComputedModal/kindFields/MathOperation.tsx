import { Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { MathOperatorSelect, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, NumberField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box } from 'components/shared/jawns'
import React from 'react'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const MathOperation = () => {
  return (
    <>
      <Title>Take values from</Title>
      <Box>
        <ColumnSelect
          columnTypes={NUMBER_COLUMN_TYPES}
          placeholder="Select number column"
          labelText="Number column"
          defaultNthOptionWithFilter={{ index: 0 }}
        />
      </Box>

      <Title mt={1}>and</Title>

      <FormItem label="Operation and number" layout="vertical" required>
        <Input.Group compact>
          <MathOperatorSelect defaultValue="+" isRequired />
          <NumberField defaultValue={1} isRequired />
        </Input.Group>
      </FormItem>
    </>
  )
}

export default MathOperation
