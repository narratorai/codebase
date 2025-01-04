import { each, keys, map, find, isEmpty, get, kebabCase } from 'lodash'
import copy from 'copy-to-clipboard'
import { downloadCsv } from 'util/download'
import { csvValueSanitizer } from 'util/helpers'

import { ColDef, ColGroupDef } from '@ag-grid-community/core'
import { RowData, ITableData } from 'components/shared/DataTable/interfaces'

// ag-grid will return {field: value} for each cell
// but we want to copy {headerName: value} so it matches
// what the user sees in the dataset table
export const formatRowData = ({ rowData, columnDefs }: { rowData: RowData; columnDefs?: ColDef | ColGroupDef }) => {
  // shouldn't happen, but if there are no column defs
  // return rowData as is
  if (!columnDefs) {
    return rowData
  }

  const formattedRowData: Record<string, string | number | null> = {}

  // loop through each rowData key (field)
  each(keys(rowData), (columnField) => {
    // use the field to find the columnDef
    const foundColumnDef = find(columnDefs, ['field', columnField])

    // use the columnDef to get the correct headerName
    if (foundColumnDef) {
      const headerName = foundColumnDef.headerName
      // and keep the same value initially passed in rowData
      const cellValue = rowData[columnField]
      formattedRowData[headerName] = cellValue
    }
  })

  return formattedRowData
}

// handle formatting row data when multiple rows are selected
export const formatMultipleRowData = ({
  selectedRowsData,
  columnDefs,
}: {
  selectedRowsData: RowData[]
  columnDefs?: ColDef | ColGroupDef
}) => {
  return map(selectedRowsData, (rowData) => formatRowData({ rowData, columnDefs }))
}

// note: rows should be pre-formatted
// note: this is technically tab separated values
// b/c it seems to work better when pasting into google sheets
export const formatCsvData = ({ rows }: { rows: RowData[] }) => {
  if (!rows || isEmpty(rows)) {
    return null
  }

  const headerKeys = keys(rows[0])
  // separate headers by tab
  const csvHeader = headerKeys.join('\t')
  // separate each row value by tab, then add a line break for next row
  const csvRows = rows.map((row) => headerKeys.map((key) => row[key]).join('\t')).join('\n')

  return csvHeader + '\n' + csvRows
}

interface CopyJsonCsvProps {
  selectedRows?: RowData[]
  rowData?: RowData
  columnDefs?: ColDef | ColGroupDef
}

export const copyJson = ({ selectedRows, rowData, columnDefs }: CopyJsonCsvProps) => {
  // check if only one row was selected
  if (isEmpty(selectedRows) && !isEmpty(rowData)) {
    return copy(JSON.stringify(formatRowData({ rowData, columnDefs })))
  }

  // otherwise multiple rows were selected
  if (!isEmpty(selectedRows) && selectedRows) {
    return copy(JSON.stringify(formatMultipleRowData({ selectedRowsData: selectedRows, columnDefs })))
  }

  // shouldn't happen, but safety return
  return null
}

export const copyCsv = ({ selectedRows, rowData, columnDefs }: CopyJsonCsvProps) => {
  // check if only one row was selected
  if (isEmpty(selectedRows) && !isEmpty(rowData)) {
    const formattedRowData = formatRowData({ rowData, columnDefs })
    const csvData = formatCsvData({ rows: [formattedRowData] })
    if (csvData) {
      // use navigator instead of copy for formatting purposes
      return navigator.clipboard.writeText(csvData)
    }
  }

  // otherwise multiple rows were selected
  if (!isEmpty(selectedRows) && selectedRows) {
    const formattedSelectedRowsData = formatMultipleRowData({ selectedRowsData: selectedRows, columnDefs })
    const csvData = formatCsvData({ rows: formattedSelectedRowsData })
    if (csvData) {
      // use navigator instead of copy for formatting purposes
      return navigator.clipboard.writeText(csvData)
    }
  }
}

interface DownloadTableDataAsCsvProps {
  title?: string
  tableData: ITableData
}

export const downloadTableDataAsCsv = ({ tableData, title }: DownloadTableDataAsCsvProps) => {
  const fileName = `${kebabCase(title) || 'table'}-${get(tableData, 'retrieved_at', 'table').slice(0, 19)}`

  // use column names as keys to maintain column orders
  // when mapping through row values
  const tableKeys: string[] = tableData.columns.map((column) => column.name)
  const csvHeader = tableKeys.map((tableKey) => csvValueSanitizer(tableKey))

  const csvData =
    csvHeader +
    '\n' +
    tableData.rows.map((row) => tableKeys.map((key) => csvValueSanitizer(row[key])).join(',')).join('\n')

  return downloadCsv({ csvData, fileName })
}
