import { formatRowData, formatMultipleRowData, formatCsvData } from './helpers'
import { ColDef } from '@ag-grid-community/core'

const rowData1 = {
  activity_id: '1234',
  customer: 'example-customer',
}

const rowData2 = {
  activity_id: '5678',
  customer: 'example-customer-2',
}

const selectedRows = [rowData1, rowData2]

const columnDefs = [
  {
    field: 'activity_id',
    headerName: 'Activity Id',
  },
  {
    field: 'customer',
    headerName: 'Customer Name',
  },
] as unknown as ColDef

describe('formatRowData', () => {
  it('can use the correct column headers', () => {
    expect(formatRowData({ rowData: rowData1, columnDefs: columnDefs })).toEqual({
      'Activity Id': '1234',
      'Customer Name': 'example-customer',
    })
  })
})

describe('formatMultipleRowData', () => {
  it('can use the correct column headers', () => {
    expect(formatMultipleRowData({ selectedRowsData: selectedRows, columnDefs: columnDefs })).toEqual([
      {
        'Activity Id': '1234',
        'Customer Name': 'example-customer',
      },
      {
        'Activity Id': '5678',
        'Customer Name': 'example-customer-2',
      },
    ])
  })
})

describe('formatCsvData', () => {
  it('can format rows into csv string', () => {
    expect(formatCsvData({ rows: selectedRows })).toEqual(
      'activity_id\tcustomer\n1234\texample-customer\n5678\texample-customer-2'
    )
  })

  it('can convert formatted rows into csv string', () => {
    const rows = formatMultipleRowData({ selectedRowsData: selectedRows, columnDefs: columnDefs })

    expect(formatCsvData({ rows })).toEqual(
      'Activity Id\tCustomer Name\n1234\texample-customer\n5678\texample-customer-2'
    )
  })
})
