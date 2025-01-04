import { FormItem } from 'components/antd/staged'
import { MathOperatorSelect, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex, Typography } from 'components/shared/jawns'
import React from 'react'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const MathOperationMulti = () => {
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

      <Flex flexWrap="wrap" alignItems="center">
        <Box width="25%" style={{ minWidth: 100 }}>
          <FormItem label="Operator" layout="vertical" required>
            <MathOperatorSelect defaultValue="+" />
          </FormItem>
        </Box>
        <Box px="4px">
          <Typography type="body50">values in</Typography>
        </Box>
        <Box width="55%" style={{ minWidth: 180 }}>
          <ColumnSelect
            columnTypes={NUMBER_COLUMN_TYPES}
            fieldKey="second_column_id"
            placeholder="Select number column"
            labelText="Number column"
            defaultNthOptionWithFilter={{ index: 1 }}
          />
        </Box>
      </Flex>
    </>
  )
}

export default MathOperationMulti
