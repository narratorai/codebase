import { IWarehouseData, WarehouseSource } from '@narratorai/the-sequel'

const foundColumns = ['FIRST', 'SECOND']
const columnsAB = ['A', 'B']

const warehouseData = {
  'DB.SCHEMA': [
    {
      table_name: 'TABLE',
      columns: foundColumns,
    },
  ],
  'DB.COMMON_SCHEMA': [
    {
      table_name: 'A_TABLE',
      columns: columnsAB,
    },
  ],
  'OTHER_DB.COMMON_SCHEMA': [
    {
      table_name: 'C_TABLE',
      columns: ['C', 'D'],
    },
  ],
} as IWarehouseData

describe('#getColumns', () => {
  const source = new WarehouseSource()
  source.setWarehouseData(warehouseData)

  it('finds exact match', () => {
    const columns = source.getColumns('DB.SCHEMA', 'TABLE')
    expect(columns).toEqual(foundColumns)
  })

  it('matches case insensitive', () => {
    const columns = source.getColumns('db.schema', 'table')
    expect(columns).toEqual(foundColumns)
  })

  it('matches with a partial schema name', () => {
    const columns = source.getColumns('SCHEMA', 'table')
    expect(columns).toEqual(foundColumns)
  })

  it('does not match a missing table', () => {
    const columns = source.getColumns('SCHEMA', 'not-defined')
    expect(columns.length).toEqual(0)
  })

  it('matched a same-name schema with fully qualified name', () => {
    const columns = source.getColumns('DB.COMMON_SCHEMA', 'A_TABLE')
    expect(columns).toEqual(columnsAB)
  })

  it('does not match a same-name schema with partial name', () => {
    const columns = source.getColumns('COMMON_SCHEMA', 'A_TABLE')
    expect(columns.length).toEqual(0)
  })
})
