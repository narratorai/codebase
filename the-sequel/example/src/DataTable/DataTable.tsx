import AgGrid from './AgGrid'

// TODO: columns needs to be an object with specific properties
export interface ITableData {
  columns: Array<string>
  rows: Array<object>
}

export interface IDataTableProps {
  tableData: ITableData
  isLoading: Boolean
}

/**
 * Table implementation we can drop in place
 */
const DataTable = ({ tableData, isLoading }: IDataTableProps) => {
  return <AgGrid tableData={tableData} isLoading={isLoading} />
}

export default DataTable
