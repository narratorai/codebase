import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, StringField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex } from 'components/shared/jawns'
import { filter, startsWith } from 'lodash'
import { STRING_COLUMN_TYPES } from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'

const StringBetween = () => {
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

      <Title>Output into a new column the strings that appear between</Title>
      <Flex>
        <Box width={1 / 2} pr="8px">
          <StringField fieldKey="from_piece" labelText="First String" />
        </Box>
        <Box width={1 / 2} pl="8px">
          <StringField fieldKey="to_piece" labelText="Second String" />
        </Box>
      </Flex>
    </>
  )
}

export default StringBetween
