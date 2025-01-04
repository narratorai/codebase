import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, StringField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex } from 'components/shared/jawns'
import { filter, startsWith } from 'lodash'
import { COLUMN_TYPE_STRING } from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'

const ReplaceString = () => {
  const columnFilter = (columns: IDatasetQueryColumn[]) => filter(columns, (col) => startsWith(col.name, 'feature_'))

  return (
    <>
      <Title>In</Title>
      <ColumnSelect
        columnTypes={[COLUMN_TYPE_STRING]}
        labelText="String Column"
        placeholder="Select a String Column"
        defaultNthOptionWithFilter={{ index: 0, filter: columnFilter }}
      />

      <Title>Replace instances of</Title>
      <Flex>
        <Box width={1 / 2} pr="8px">
          <StringField fieldKey="remove_str" labelText="Value from selected column" />
        </Box>
        <Box width={1 / 2} pl="8px">
          <StringField fieldKey="replace_str" labelText="Replace with" />
        </Box>
      </Flex>
    </>
  )
}

export default ReplaceString
