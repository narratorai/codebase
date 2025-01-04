import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, StringField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex } from 'components/shared/jawns'
import { filter, startsWith } from 'lodash'
import React, { useState } from 'react'
import { STRING_COLUMN_TYPES } from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'

const ConcatenateString = () => {
  const [addBefore, setAddBefore] = useState(true)
  const [addAfter, setAddAfter] = useState(true)

  const toggleBefore = () => setAddBefore(!addBefore)
  const toggleAfter = () => setAddAfter(!addAfter)

  const columnFilter = (columns: IDatasetQueryColumn[]) => filter(columns, (col) => startsWith(col.name, 'feature_'))
  return (
    <>
      <Title>From</Title>
      <ColumnSelect
        columnTypes={STRING_COLUMN_TYPES}
        labelText="String Column"
        placeholder="Select a String Column"
        defaultNthOptionWithFilter={{ index: 0, filter: columnFilter }}
      />

      <Flex>
        <Flex width={1 / 2} alignItems="center" pr="8px">
          <Box mr="4px">
            <input type="checkbox" checked={addBefore} onChange={toggleBefore} />
          </Box>
          <StringField fieldKey="string_before" labelText="Add String BEFORE" isRequired={addBefore} />
        </Flex>
        <Flex width={1 / 2} alignItems="center" pl="8px">
          <Box mr="4px">
            <input type="checkbox" checked={addAfter} onChange={toggleAfter} />
          </Box>
          <StringField fieldKey="string_after" labelText="Add String AFTER" isRequired={addAfter} />
        </Flex>
      </Flex>
    </>
  )
}

export default ConcatenateString
