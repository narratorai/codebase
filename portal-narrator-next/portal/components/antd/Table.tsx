import { Table as AntdTable } from 'antd-next'
import { TableProps } from 'antd-next/es/table'
import { ColumnFilterItem } from 'antd-next/lib/table/interface'
import { includes, toLower } from 'lodash'
import styled from 'styled-components'

const StyledTable = styled(AntdTable)`
  .antd5-table-thead > tr > th {
    background-color: white;
  }

  td.antd5-table-column-sort {
    background: white;
  }
`

const Table = (props: TableProps<any>) => {
  return <StyledTable pagination={false} {...props} />
}

export const tableFilterSearch = (input = '', record: ColumnFilterItem) => {
  // if filters are not searched for - show them all
  if (!input) {
    return true
  }

  const text = toLower(record.text as string)
  const value = toLower(record.value as string)
  const formattedInput = toLower(input)
  return includes(text, formattedInput) || includes(value, formattedInput)
}

export default Table
