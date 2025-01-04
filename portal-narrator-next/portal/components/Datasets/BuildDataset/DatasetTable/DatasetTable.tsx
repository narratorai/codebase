/* eslint-disable max-lines-per-function */
import { CellClassParams, CellContextMenuEvent, ColDef, DragStoppedEvent, RowSpanParams } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { Button, Result } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import LinkCellRenderer, { findLinkColumns } from 'components/shared/DataTable/LinkCellRenderer'
import ValueFormatter from 'components/shared/DataTable/ValueFormatter'
import OverscrollHover from 'components/shared/OverscrollHover'
import { each, filter, find, first, get, includes, isEmpty, isNumber, max, startCase, values } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useCallback, useContext, useMemo, useRef } from 'react'
import { contextMenu } from 'react-contexify'
import styled from 'styled-components'
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  HEADER_ROW_HEIGHT,
  makeColumnConfigs,
  NUMBER_COLUMN_TYPES,
} from 'util/datasets'
import { IDatasetColumnMapping, IDatasetFormContext, IRequestApiData } from 'util/datasets/interfaces'

import DatasetAgGrid from './DatasetAgGrid'
import { GRID_CONTEXT_MENU_ID } from './GridContextMenu'
import HeaderGridRenderer from './HeaderGridRenderer'
import ReadonlyCellEditor from './ReadonlyCellEditor'

// limit the size of the span allowed: if a column wants to span more than this many rows we turn
// off spanning entirely. This is for performance (column drag & horizontal scroll).
const MAX_ALLOWED_SPAN = 30
const BOTTOM_SPAN_FOUND = 0 // see comment in computeRowSpans

// The bottom horizontal scroll bar was not clickable
// Adding z-index to allow click to scroll events
// Also: https://github.com/ag-grid/ag-grid/issues/4830#issuecomment-994112842
const StyledBodyContainer = styled.div`
  height: calc(100% - ${HEADER_ROW_HEIGHT}px);

  .ag-body-horizontal-scroll-viewport {
    z-index: 1010;
  }

  .ag-body-horizontal-scroll.ag-scrollbar-invisible {
    pointer-events: all !important;
  }
`

const computeRowSpans = (tableRows: Array<Record<string, any>>, column: { id: string; name: string } | null) => {
  // Returns an array per group by column with the number of rows each row spans

  // When subsequent rows in a given column have the same value we want to visually 'group' them together. This
  // means the first (topmost) row should span (visually cover) all the ones below it that share its value

  // A row that spans several rows will have a value > 1; i.e. the total number of rows it should span
  // A row being spanned by another above it will return 1
  // The bottom-most row being spanned by another returns 0 (BOTTOM_SPAN_FOUND)
  // The BOTTOM_SPAN_FOUND value is only for CSS -- so we can add a bottom border

  // i.e.
  // 2018 -> span = 3
  // 2018 -> span = 1
  // 2018 -> span = 0
  // 2019 -> span = 2
  // 2019 -> span = 0
  // 2020 -> span = 1
  // 2021 -> span = 1

  // Visually it renders like this
  // 2018 |     |
  //      |     |
  // _____|_____|___
  // 2019 |     |
  // _____|_____|___
  // 2020 |     |
  // 2021 |     |

  const spanMap: Record<string, Array<number>> = {}

  if (!tableRows || !column) {
    return spanMap
  }

  const columnName = column.name // use name to index into the tableRows data
  const columnId = column.id // use id b/c that's what we use everywhere else

  let previousValue: any = undefined
  let span = 1
  let maxSpan = 0
  let foundSpan = false

  const spanList = [tableRows.length]

  // walk backwards and count up how many rows need to be covered (spanned)
  for (let i = tableRows.length - 1; i >= 0; i--) {
    const row = tableRows[i]
    const value = row[columnName]

    if (value == previousValue) {
      // same as row above it; so should be spanned
      foundSpan = true
      if (!isNumber(spanList[i + 1])) {
        // bottom spans have already been set, so skip them if they have
        spanList[i + 1] = 1
      }
      span += 1
    } else {
      // different than row above it; means the row before spans all the ones below
      if (!isNumber(spanList[i + 1])) {
        spanList[i + 1] = span
        if (span > maxSpan) {
          maxSpan = span
        }
      }
      spanList[i] = BOTTOM_SPAN_FOUND // this row is a bottom border so mark it with a special value
      span = 1
    }

    previousValue = value
  }
  spanList[0] = span // first row isn't set in the loop above

  // Special-case: if no spans were found, or we exceeded our max,
  // clear everything back to 1 so we don't get bottom borders on everything
  if (!foundSpan || maxSpan > MAX_ALLOWED_SPAN) {
    for (let i = 0; i < spanList.length; i++) {
      spanList[i] = 1
    }
  }

  spanMap[columnId] = spanList
  return spanMap
}

// Performance note
// Our header is fairly complex to render, which means we never want to virtualize the column headers.
// This means they'll always be cached and not rerender when scrolling horizontally
//
// Unfortunately this is a problem when scrolling vertically.
// We need to virtualize the table columns because if we don't we'll be rendering all table data for the
// offscreen columns while scrolling. This slows it down a lot
//
// What AgGrid doesn't do is allow us to virtualize the columns for rows and header separately.
//
// We use two aligned grids to achieve this. We have a feature request to suppress just header virtualization.
// When that's in place we can go back to a single grid.
//
// This is tracked by
// AG-5503	[Scrolling] Add a new property suppressHeaderColumnVirtualisation to only apply to header row, not the data rows
// https://ag-grid.com/ag-grid-pipeline/

const DatasetTable = () => {
  const { machineCurrent, machineSend, groupSlug, onRunDataset, selectedApiData, activityStream } =
    useContext<IDatasetFormContext>(DatasetFormContext)
  const queryData = get(selectedApiData, ACTION_TYPE_QUERY, {}) as IRequestApiData
  const loadingData = queryData.loading
  const tableRows = get(queryData, 'response.data.rows', null) as []
  const mavisColumnMapping = selectedApiData.column_mapping
  const company = useCompany()
  const isDuplicateParentGroup = machineCurrent.context._is_parent_duplicate

  const headerGrid = useRef<AgGridReact>(null)
  const contentGrid = useRef<AgGridReact>(null)

  const handleOnDragStopColumn = useCallback(
    (event: DragStoppedEvent) => {
      // maintain order/pinned when dragging column headers
      const allColumns = event.api.getAllDisplayedColumns()
      machineSend('SET_COLUMNS_ORDER', { groupSlug, agGridColumns: allColumns })
    },
    [groupSlug, machineSend]
  )

  const onCellContextMenu = useCallback((event: CellContextMenuEvent) => {
    // menuProvider does not work well with Ag Grid context events
    // programatically open the menu and pass event data

    const cellValue = event.value
    const columnHeader = event.colDef.headerName
    const columnId = event.colDef.headerComponentParams?.columnConfig?.query?.id
    const columnType = event.colDef.headerComponentParams?.columnConfig?.query?.type
    const rowData = event.data

    // check if multiple rows were selected
    const selectedRows = event.api.getSelectedRows()

    // get columnDefs to map fields -> headerName
    const columnDefs = event.api.getColumnDefs()

    contextMenu.show({
      id: GRID_CONTEXT_MENU_ID,
      event: event.event as MouseEvent | TouchEvent,
      props: {
        cellValue,
        columnHeader,
        columnId,
        columnType,
        rowData,
        selectedRows,
        columnDefs,
      },
    })
  }, [])

  //
  // Column order (and pinned) logic
  // used to make Column Definition below
  //
  const columnsOrder = machineCurrent.context?.columns_order?.[groupSlug || 'parent']
  // check if columns_order has been set
  // if so - ensure that column_mappings are sorted by this order
  // (column_mapping only gets updated on dataset run... they could have changed the order and not run)
  // Note: sortedColumnMapping is constructed from selectedApiData.column_mapping
  //// force correct "pinned" based on handleOnDragStopColumn results (set to machine)

  const sortedColumnMapping = useMemo<IDatasetColumnMapping[]>(() => {
    const sortedColumns: IDatasetColumnMapping[] = []

    // Check left pinned
    if (columnsOrder?.left_pinned) {
      each(columnsOrder?.left_pinned, (colId) => {
        const foundMapping = find(mavisColumnMapping, ['id', colId])
        if (foundMapping) {
          // order is pinned left - so force to pinned 'left'
          sortedColumns.push({ ...foundMapping, pinned: 'left' })
        }
      })
    }

    // backfill fix: we used to put all columns in "order" (even if pinned)
    // remove pinned columns from "order" for all old datasets
    const allPinnedColumnIds = [...(columnsOrder?.left_pinned || []), ...(columnsOrder?.right_pinned || [])]
    const nonDuppedColumnsOrder = filter(columnsOrder?.order, (orderCol) => !includes(allPinnedColumnIds, orderCol))
    // Check not pinned (regular order)
    if (nonDuppedColumnsOrder) {
      each(nonDuppedColumnsOrder, (colId) => {
        const foundMapping = find(mavisColumnMapping, ['id', colId])
        if (foundMapping) {
          // order is not pinned - so force to pinned null
          sortedColumns.push({ ...foundMapping, pinned: null })
        }
      })
    }

    // Check right pinned
    if (columnsOrder?.right_pinned) {
      each(columnsOrder?.right_pinned, (colId) => {
        const foundMapping = find(mavisColumnMapping, ['id', colId])
        if (foundMapping) {
          // order is pinned right - so force to pinned 'right'
          sortedColumns.push({ ...foundMapping, pinned: 'right' })
        }
      })
    }

    // edge case check: https://app.shortcut.com/narrator/story/3926/if-you-run-a-tab-in-the-backgorund-the-new-columns-don-t-show-up
    // if user adds metrics/compute columns
    // runs the dataset and navigates to another group before response
    // then navigates back to the original tab after response
    // the new column(s) are missing in the dataset table
    // Add any unaccounted for column_mappings to sortedColumns
    if (columnsOrder?.order || columnsOrder?.left_pinned || columnsOrder?.right_pinned) {
      each(mavisColumnMapping, (col) => {
        const columnNotAddedToSortedMapping = !find(sortedColumns, ['id', col.id])
        if (columnNotAddedToSortedMapping) {
          sortedColumns.push(col)
        }
      })
    }

    return sortedColumns
  }, [columnsOrder, mavisColumnMapping])

  //
  // Column definitions
  //
  const columnConfigs = makeColumnConfigs({
    // columnMapping: mavisColumnMapping || [],
    columnMapping: !isEmpty(sortedColumnMapping) ? sortedColumnMapping : mavisColumnMapping || [],
    // FIXME: treat it like a parent if is duplicate of parent
    groupSlug: isDuplicateParentGroup ? undefined : groupSlug,
    metrics: selectedApiData?.metrics || [],
    totalRows: selectedApiData?.total_rows,
    queryDefinition: makeQueryDefinitionFromContext(machineCurrent.context),
  })

  const machineGroup = machineCurrent.context.all_groups.find((group) => group.slug == groupSlug)
  const groupColumnIds = machineGroup?.columns.map((c) => c.id)

  const columnLabelFromId = useCallback(
    (columnId: string | undefined) => {
      const foundColumn = columnConfigs.find((config) => {
        const colId = get(config, 'query.id')
        return colId == columnId
      })

      return foundColumn?.accessor
    },
    [columnConfigs]
  )

  //
  // Row spanning: the first group by column sorted in the grid will span duplicate values
  //

  const getFirstOrderGroupColumn = useCallback(() => {
    const order = machineGroup?.order

    if (order && groupColumnIds) {
      const firstSortedGroupId = find(order, (o) => groupColumnIds.includes(o.column_id))?.column_id
      const name = columnLabelFromId(firstSortedGroupId)

      // find the label from id
      if (firstSortedGroupId && name) {
        return { id: firstSortedGroupId, name: name }
      }
    }

    return null
  }, [columnLabelFromId, machineGroup, groupColumnIds])

  const rowSpanLookup = useMemo(
    () => computeRowSpans(tableRows, getFirstOrderGroupColumn()),
    [tableRows, getFirstOrderGroupColumn]
  )

  const getRowSpan = useCallback(
    (columnId: string | undefined, rowIndex: number | null | undefined): number => {
      if (columnId && isNumber(rowIndex)) {
        const list = get(rowSpanLookup, columnId, [])
        if (rowIndex < list.length) {
          return rowSpanLookup[columnId][rowIndex]
        }
      }

      return 1
    },
    [rowSpanLookup]
  )

  const cellClassForColumn = useCallback(
    // This allows us to style grid cells so that we can draw a horizontal line
    // across the grid to visually separate spanned rows
    // See comment in computeRowSpans explaining the process

    (params: CellClassParams) => {
      const columnId = params.colDef.colId
      const cellClasses = []

      // the fact that we've set the cellClass property in ColDefs means we have to manually set 'ag-right-aligned-cell'
      // ag grid would otherwise set it on our behalf when detecting a numeric column
      if (params.colDef.type == 'numericColumn') {
        cellClasses.push('ag-right-aligned-cell')
      }

      if (!groupColumnIds || !columnId) {
        return cellClasses
      }

      if (groupColumnIds.includes(columnId)) {
        // if this cell spans multiple rows, then it needs the cell-span class
        if (getRowSpan(columnId, params.rowIndex) > 1) {
          cellClasses.push('cell-span')
          cellClasses.push('spanned-cell-bottom')
        }
      }

      // All cells that are at the bottom of a row span, regardless of column, need
      // a line across them.
      const firstGroup = first(groupColumnIds)
      const span = getRowSpan(firstGroup, params.rowIndex)

      if (span == BOTTOM_SPAN_FOUND) {
        cellClasses.push('spanned-cell-bottom')
      }

      return cellClasses
    },
    [getRowSpan, groupColumnIds]
  )

  const rowSpanForColumn = useCallback(
    (params: RowSpanParams) => {
      const span = getRowSpan(params.colDef.colId, params.node?.rowIndex)
      return span == BOTTOM_SPAN_FOUND ? 1 : span // if the span has the special value marking it as a bottom span we return 1,
      // since that special value is just for cellClassForColumn
    },
    [getRowSpan]
  )

  // Backup guard for if it errors out and loaded is true
  if (!tableRows && !loadingData) {
    return (
      <Result
        extra={
          // Issue with SyntheticEvent when onRunDataset wasn't wrapped in a function:
          // https://reactjs.org/docs/events.html#event-pooling
          <Button onClick={() => onRunDataset()} type="primary">
            Run Query
          </Button>
        }
        title="Run query to fetch data"
      />
    )
  }

  if (!(tableRows && mavisColumnMapping && activityStream && company)) {
    return null
  }

  // A quirk of a column that spans several rows: we have to ensure that we keep a row buffer large enough
  // to handle all its spanned rows. If not it'll get virtualized away when scrolled partly offscreen and
  // the underlying (spanned) rows will now be magically visible. This isn't handled automatically unfortunately.
  // The fix is to ensure our virtualization buffer is as large as the largest span we have.
  // We don't set it to an arbitrary large number, like 1000, because a large row buffer is terrible for horizontal
  // scrolling and column reordering performance.
  const rowBuffer = (max(first(values(rowSpanLookup))) || 1) + 1

  const linkColumns = findLinkColumns(mavisColumnMapping, tableRows)
  const formatter = new ValueFormatter(mavisColumnMapping, company?.currency_used)

  const columnDefs = columnConfigs.map((config) => {
    const columnId = get(config, 'query.id')
    const columnName = config.accessor
    const dataType = get(config, 'query.type', null)
    const type = NUMBER_COLUMN_TYPES.includes(dataType) ? 'numericColumn' : undefined // numeric columns are right-aligned
    const isGroupByColumn = get(config.query, '_isGroupByColumn')

    return {
      colId: columnId,
      headerName: get(config, 'query.label') || startCase(columnName),
      field: columnName,
      pinned: config.pinned,
      tooltipField: columnName, // turn on browser tooltips
      valueFormatter: formatter.getFormatter(columnName),
      headerComponentParams: { columnConfig: config },
      type,
      cellRenderer: includes(linkColumns, columnName) ? LinkCellRenderer : undefined,
      rowSpan: isGroupByColumn ? rowSpanForColumn : undefined,
      cellClass: cellClassForColumn,
    } as ColDef
  })

  const defaultColDef = {
    minWidth: DEFAULT_COLUMN_WIDTH,
    sortable: false,
    cellEditor: ReadonlyCellEditor,
    onCellContextMenu,
  }

  const headerOptions = {
    suppressNoRowsOverlay: true,
    animateRows: false,
    headerHeight: HEADER_ROW_HEIGHT,
    suppressColumnVirtualisation: true,
    suppressHorizontalScroll: true,
    onDragStopped: handleOnDragStopColumn,
  }

  const rowOptions = {
    headerHeight: 0,
    rowHeight: DEFAULT_ROW_HEIGHT,
    suppressColumnVirtualisation: false,
    rowBuffer: rowBuffer,
    suppressAnimationFrame: true,
    context: { timezone: company.timezone, activityStream, companySlug: company.slug },
  }

  return (
    <OverscrollHover style={{ height: '100%' }}>
      <DatasetAgGrid
        alignedGrids={[contentGrid]}
        asHeader
        columnDefs={columnDefs}
        //headerComponent is not happy that it's getting class component instead of a function component, but works anyway
        defaultColDef={{ headerComponent: HeaderGridRenderer as unknown as new () => any, ...defaultColDef }}
        gridOptions={headerOptions}
        height={HEADER_ROW_HEIGHT}
        ref={headerGrid}
        rowData={[]}
      />

      <StyledBodyContainer>
        <DatasetAgGrid
          alignedGrids={[headerGrid]}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={rowOptions}
          ref={contentGrid}
          rowData={tableRows}
        />
      </StyledBodyContainer>
    </OverscrollHover>
  )
}

export default DatasetTable
