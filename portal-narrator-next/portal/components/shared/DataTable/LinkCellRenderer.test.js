import _ from 'lodash'
import { findLinkColumns } from './LinkCellRenderer'

describe('findLinkColumns', () => {
  const columns = [
    { label: 'nolink', format: 'string' },
    { label: 'haslink', format: 'id' },
  ]

  it('finds a link column with nulls before', () => {
    const rows = [
      { nolink: 'hello', haslink: null },
      { nolink: 'hello', haslink: null },
      { nolink: 'hello', haslink: null },
      { nolink: 'hello', haslink: 'http://www.narrator.ai' },
    ]

    expect(findLinkColumns(columns, rows)).toEqual(['haslink'])
  })

  it('finds multiple link columns', () => {
    const rows = [
      { nolink: 'hello', haslink: null, otherlink: null },
      { nolink: 'hello', haslink: null, otherlink: 'https://www.activityschema.com' },
      { nolink: 'hello', haslink: null, otherlink: null },
      { nolink: 'hello', haslink: 'http://www.narrator.ai', otherlink: null },
    ]

    const testColumns = _.clone(columns)
    testColumns.push({ label: 'otherlink', format: 'string' })

    expect(findLinkColumns(testColumns, rows).sort()).toEqual(['haslink', 'otherlink'].sort())
  })

  it('finds links in a long table', () => {
    const rows = []
    for (var i = 0; i < 2000; i++) {
      rows.push({
        nolink: i,
        haslink: i < 300 ? null : `https://www.narrator.ai/${i}`,
      })
    }

    expect(findLinkColumns(columns, rows)).toEqual(['haslink'])
  })

  it('works on null rows', () => {
    const rows = null
    expect(findLinkColumns(columns, rows)).toEqual([])
  })
})
