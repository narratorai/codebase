import { FieldProps } from '@rjsf/core'
import { Table } from 'components/antd/staged'

interface TableColumn {
  title: string
  data_index: string
}

interface Props extends FieldProps {
  formData: {
    columns: TableColumn[]
    rows: { [key: string]: string }[]
  }
}

const TableField = ({ formData }: Props) => {
  const { columns, rows } = formData

  const dataSource = rows.map((row, index) => {
    return {
      ...row,
      key: index,
    }
  })

  const tableColumns = columns.map((column) => {
    return {
      ...column,
      dataIndex: column.data_index,
      key: column.data_index,
    }
  })

  return <Table dataSource={dataSource} columns={tableColumns} />
}

export default TableField
