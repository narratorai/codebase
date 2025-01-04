import {
  parseFormValues,
  getDatasetsFromNarrativeConfig,
  getJsonInputValue,
  highlightSourceTokens,
  makeFiles,
  makeFileOptions,
  getVisibleFileOptions,
  sortTableColumns,
  makeOrderedTableColumns,
} from './helpers'
import narrativeConfig from '../../../test/fixtures/narrativeConfig.json'
import moment from 'moment-timezone'

const emptyConfig = {
  narrative: {
    sections: [],
  },
}

describe('helpers', () => {
  describe('#getDatasetsFromNarrativeConfig', () => {
    it('gets datasets used in Narrative', () => {
      expect(getDatasetsFromNarrativeConfig({ narrativeConfig })).toMatchSnapshot()
    })
  })

  describe('#parseFormValues', () => {
    it('parses plot_options from JSON string to object', () => {
      expect(parseFormValues({ narrativeConfig })).toMatchSnapshot()
    })

    it('parses field_configs array string input', () => {
      const field_configs = JSON.stringify([{ ok: 'hi' }, { test: true }])
      expect(parseFormValues({ narrativeConfig: { ...emptyConfig, field_configs } })).toMatchSnapshot()
    })

    it('parses field_configs array empty', () => {
      expect(parseFormValues({ narrativeConfig: { ...emptyConfig, field_configs: '' } })).toMatchSnapshot()
    })
  })

  describe('#highlightSourceTokens', () => {
    it('handles {single_curley} in markdown', () => {
      const result = highlightSourceTokens(
        '## How many different ad sources do customers engage with before they {conversion_action}  (media-mix)?'
      )

      expect(result).toBe(
        '## How many different ad sources do customers engage with before they `{conversion_action}`  (media-mix)?'
      )
    })

    it('handles {$funky_keys} in markdown', () => {
      const result = highlightSourceTokens(
        '## How many different ad sources do {#customers} engage with before they {$conversion_action}  (media-mix)?'
      )

      expect(result).toBe(
        '## How many different ad sources do `{#customers}` engage with before they `{$conversion_action}`  (media-mix)?'
      )
    })

    it('handles multiline fields in markdown', () => {
      const result = highlightSourceTokens(`
      What about {
        multiline + 5
      }?
      `)
      expect(result).toBe(`
      What about \`{
        multiline + 5
      }\`?
      `)
    })

    it('handles passing in a non-string', () => {
      const obj = {
        text: 'foo',
      }
      const result = highlightSourceTokens(obj)

      expect(result).toEqual(obj)
    })

    it('handles null and undefined', () => {
      expect(highlightSourceTokens()).toEqual('')
      expect(highlightSourceTokens(null)).toEqual('')
    })
  })

  describe('#getJsonInputValue', () => {
    it('converts stringified JSON to object', () => {
      const value =
        '{"header":"This Week","title":"Total Revenue","value":"{#total_revenue_this_week}","description":"","dataset_slug":"completed_orders_with_shipping_rate","group_slug":"week"}'
      expect(getJsonInputValue(value)).toEqual(JSON.parse(value))
    })

    it('returns empty object when there is an invalid JSON string', () => {
      const value = '{"header":::"This Week",///'
      expect(getJsonInputValue(value)).toEqual({})
    })
  })

  const narrativeRuns = [
    {
      s3_key: 'prod/mavis/caches/narratives/testing/valid/2022-10-27.json',
    },
    {
      s3_key: 'prod/mavis/caches/narratives/testing/valid/2022-9-27.json',
    },
    {
      s3_key: 'prod/mavis/caches/narratives/testing/valid/2022-8-27.json',
    },
  ]

  const files = makeFiles(narrativeRuns)
  const fileOptions = makeFileOptions(files)

  describe('#makeFiles', () => {
    it('returns an empty array if no narrative runs are passed', () => {
      expect(makeFiles()).toEqual([])
    })

    it('returns files in the correct format', () => {
      expect(files).toMatchSnapshot()
    })

    it('returns an array of files ordered by timestamp', () => {
      expect(moment(files[0].name).isAfter(files[1].name)).toBe(true)
      expect(moment(files[1].name).isAfter(files[2].name)).toBe(true)
    })
  })

  describe('#makeFileOptions', () => {
    it('returns an empty array if no files are passed', () => {
      expect(makeFileOptions()).toEqual([])
    })

    it('returns options in the correct format', () => {
      expect(fileOptions).toMatchSnapshot()
    })

    it('returns an array of options ordered by timestamp', () => {
      expect(moment(fileOptions[0].value).isAfter(fileOptions[1].value)).toBe(true)
      expect(moment(fileOptions[1].value).isAfter(fileOptions[2].value)).toBe(true)
    })
  })

  describe('#getVisibleFileOptions', () => {
    it('returns an empty array if no options are within the time window set', () => {
      const visibleFileOptions = getVisibleFileOptions({ toTime: '2022-6-27', fromTime: '2022-3-27', fileOptions })
      expect(visibleFileOptions).toEqual([])
    })

    it('returns all options within the time window set', () => {
      const visibleFileOptions = getVisibleFileOptions({ toTime: '2022-11-27', fromTime: '2022-3-27', fileOptions })
      expect(visibleFileOptions.length).toEqual(fileOptions.length)
    })

    it('returns options in the correct format', () => {
      const visibleFileOptions = getVisibleFileOptions({ toTime: '2022-11-27', fromTime: '2022-3-27', fileOptions })
      expect(visibleFileOptions).toMatchSnapshot()
    })

    it('returns an array of options ordered by timestamp', () => {
      const visibleFileOptions = getVisibleFileOptions({ toTime: '2022-11-27', fromTime: '2022-3-27', fileOptions })
      expect(moment(visibleFileOptions[0].value).isAfter(visibleFileOptions[1].value)).toBe(true)
      expect(moment(visibleFileOptions[1].value).isAfter(visibleFileOptions[2].value)).toBe(true)
    })
  })

  describe('#sortTableColumns', () => {
    const column1 = {
      name: 'column_1',
      pinned: null,
      order: 0,
    }

    const column2 = {
      name: 'column_2',
      pinned: null,
      order: 1,
    }

    const column3 = {
      name: 'column_3',
      pinned: null,
      order: 2,
    }

    const column4 = {
      name: 'column_4',
      pinned: null,
      order: 3,
    }

    const column5 = {
      name: 'column_5',
      pinned: null,
      order: 4,
    }

    // These columns have not been sorted/pinned yet
    const columns = [column1, column2, column3, column4, column5]

    it('returns the same columns if no columnOrder is passed', () => {
      expect(sortTableColumns({ columns })).toEqual(columns)
    })

    it('returns a new order if a columnOrder is passed', () => {
      const columnOrder = { order: ['column_5', 'column_4', 'column_3', 'column_2', 'column_1'] }
      const columnsToReverse = [...columns]
      const reversedColumns = columnsToReverse.reverse()

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      expect(sortedColumns).toEqual(reversedColumns)
    })

    it('returns a left pinned column before other columns and updates its pinned key to left', () => {
      const columnOrder = { left: ['column_5'], order: ['column_1', 'column_2', 'column_3', 'column_4'] }

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      const firstSortedColumn = sortedColumns[0]
      expect(firstSortedColumn.pinned).toEqual('left')

      const expectedColumns = [firstSortedColumn, ...columns.slice(0, 4)]
      expect(sortedColumns).toEqual(expectedColumns)
    })

    it('returns correct order and format for left pinned and new order', () => {
      const columnOrder = { left: ['column_5'], order: ['column_4', 'column_3', 'column_2', 'column_1'] }

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      const firstSortedColumn = sortedColumns[0]
      expect(firstSortedColumn.pinned).toEqual('left')

      const expectedColumns = [firstSortedColumn, column4, column3, column2, column1]
      expect(sortedColumns).toEqual(expectedColumns)
    })

    it('returns a right pinned column after other columns and updates its right key to right', () => {
      const columnOrder = { order: ['column_1', 'column_3', 'column_4', 'column_5'], right: ['column_2'] }

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      const lastSortedColumn = sortedColumns[sortedColumns.length - 1]
      expect(lastSortedColumn.pinned).toEqual('right')

      const expectedColumns = [column1, column3, column4, column5, lastSortedColumn]
      expect(sortedColumns).toEqual(expectedColumns)
    })

    it('returns correct order and format for right pinned and new order', () => {
      const columnOrder = { order: ['column_4', 'column_2', 'column_3', 'column_1'], right: ['column_5'] }

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      const lastSortedColumn = sortedColumns[sortedColumns.length - 1]
      expect(lastSortedColumn.pinned).toEqual('right')

      const expectedColumns = [column4, column2, column3, column1, lastSortedColumn]
      expect(sortedColumns).toEqual(expectedColumns)
    })

    it('returns correct order and pinned when both left and right pinned columns are passed', () => {
      const columnOrder = { left: ['column_2'], order: ['column_3', 'column_5', 'column_1'], right: ['column_4'] }

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      const firstSortedColumn = sortedColumns[0]
      const lastSortedColumn = sortedColumns[sortedColumns.length - 1]

      expect(firstSortedColumn.pinned).toEqual('left')
      expect(lastSortedColumn.pinned).toEqual('right')

      const expectedColumns = [firstSortedColumn, column3, column5, column1, lastSortedColumn]
      expect(sortedColumns).toEqual(expectedColumns)
    })

    it('returns corect order and pinned when multiple left and right pinned columns are passed', () => {
      const columnOrder = { left: ['column_3', 'column_2'], order: ['column_5'], right: ['column_4', 'column_1'] }

      const sortedColumns = sortTableColumns({ columns, columnOrder })
      const firstSortedColumn = sortedColumns[0]
      const secondSortedColumn = sortedColumns[1]
      const lastSortedColumn = sortedColumns[sortedColumns.length - 1]
      const secondToLastSortedColumn = sortedColumns[sortedColumns.length - 2]

      expect(firstSortedColumn.pinned).toEqual('left')
      expect(secondSortedColumn.pinned).toEqual('left')
      expect(lastSortedColumn.pinned).toEqual('right')
      expect(secondToLastSortedColumn.pinned).toEqual('right')

      const expectedColumns = [
        firstSortedColumn,
        secondSortedColumn,
        column5,
        secondToLastSortedColumn,
        lastSortedColumn,
      ]
      expect(sortedColumns).toEqual(expectedColumns)
    })
  })

  describe('#makeOrderedTableColumns', () => {
    it('if no columns are found, return right, left, order as empty arrays', () => {
      const stubbedEvent = {
        columnApi: {
          getAllDisplayedColumns: jest.fn(() => []),
        },
      }
      expect(makeOrderedTableColumns(stubbedEvent)).toEqual({ left: [], right: [], order: [] })
    })

    it('if only left pinned columns are found, return left with pinned columns and right/order as empty arrays', () => {
      const stubbedEvent = {
        columnApi: {
          getAllDisplayedColumns: jest.fn(() => [{ colId: 'column_1', pinned: 'left' }]),
        },
      }

      expect(makeOrderedTableColumns(stubbedEvent)).toEqual({ left: ['column_1'], right: [], order: [] })
    })

    it('if only right pinned columns are found, return right with pinned columns and left/order as empty arrays', () => {
      const stubbedEvent = {
        columnApi: {
          getAllDisplayedColumns: jest.fn(() => [{ colId: 'column_1', pinned: 'right' }]),
        },
      }

      expect(makeOrderedTableColumns(stubbedEvent)).toEqual({ left: [], right: ['column_1'], order: [] })
    })

    it('if no pinned columns are found, return order with column ids and empty left/right arrays', () => {
      const stubbedEvent = {
        columnApi: {
          getAllDisplayedColumns: jest.fn(() => [{ colId: 'column_1', pinned: null }]),
        },
      }

      expect(makeOrderedTableColumns(stubbedEvent)).toEqual({ left: [], right: [], order: ['column_1'] })
    })

    it('returns left, right, and order if all are passed', () => {
      const stubbedEvent = {
        columnApi: {
          getAllDisplayedColumns: jest.fn(() => [
            { colId: 'column_1', pinned: null },
            { colId: 'column_2', pinned: 'right' },
            { colId: 'column_3', pinned: 'left' },
            { colId: 'column_4', pinned: null },
            { colId: 'column_5', pinned: 'left' },
            { colId: 'column_6', pinned: null },
          ]),
        },
      }

      expect(makeOrderedTableColumns(stubbedEvent)).toEqual({
        left: ['column_3', 'column_5'],
        right: ['column_2'],
        order: ['column_1', 'column_4', 'column_6'],
      })
    })
  })
})
