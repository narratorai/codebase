import { Box } from 'components/shared/jawns'
import { isEmpty, map } from 'lodash'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledTable = styled.table`
  th,
  td {
    padding-top: 4px;
    padding-bottom: 4px;
    word-break: break-word;
  }

  th {
    font-weight: 600;
    min-width: 128px;
    text-align: left;
    padding-right: 8px;
  }

  tr:not(:last-of-type) {
    border-bottom: ${colors.gray300};
  }
`

interface Item {
  label: string
  value: React.ReactNode
}

interface Props {
  items: Item[]
}

const TableWithRows = ({ items }: Props) => {
  // if there are no items, don't show the table
  if (isEmpty(items)) {
    return null
  }

  return (
    <Box>
      <StyledTable style={{ width: '100%' }}>
        <tbody>
          {map(items, (item) => (
            <tr key={`${item.label}_${item.value}`}>
              <th>{item.label}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </Box>
  )
}

export default TableWithRows
