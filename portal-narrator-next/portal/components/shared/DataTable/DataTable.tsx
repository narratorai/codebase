/* eslint-disable max-lines-per-function */
import {
  CellContextMenuEvent,
  CellEditingStartedEvent,
  CellValueChangedEvent,
  ColDef,
  GridApi,
} from '@ag-grid-community/core'
import { useCompany } from 'components/context/company/hooks'
import GridContextMenu from 'components/shared/DataTable/GridContextMenu'
import ValueFormatter from 'components/shared/DataTable/ValueFormatter'
import _ from 'lodash'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { contextMenu } from 'react-contexify'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { NUMBER_COLUMN_TYPES } from 'util/datasets/constants'
import { makeShortid } from 'util/shortid'

import CustomerCellRenderer from './CustomerCellRenderer'
import CustomerJourneyDrawer from './CustomerJourneyDrawer'
import { IDataTableProps } from './interfaces'
import LinkCellRenderer, { findLinkColumns } from './LinkCellRenderer'

const AgGrid = React.lazy(() => import(/* webpackChunkName: "ag-grid" */ 'components/shared/DataTable/AgGrid'))

const GridContainer = styled.div<{ rowHeight: number }>`
  height: 100%;

  --ag-header-background-color: white;
  --ag-odd-row-background-color: white;
  --ag-row-border-color: ${colors.gray300};
  --ag-border-color: ${colors.gray200};

  .ag-row {
    .ag-cell {
      padding: ${({ rowHeight }) => rowHeight / 3}px 11px;

      a {
        color: ${(props) => props.theme.colors.black};
      }
    }

    .ag-cell-inline-editing {
      padding: 0;
      margin: 0 6px;
      height: ${({ rowHeight }) => rowHeight}px;
    }
  }

  .ag-header-cell {
    .ag-header-cell-text {
      white-space: normal;
    }
  }

  @media print {
    box-shadow: none;

    .ag-theme-balham {
      --ag-border-color: ${colors.gray300};

      .ag-body-viewport {
        overflow: hidden;
      }

      .ag-body-horizontal-scroll {
        display: none;
      }
    }
  }
`

//
// Creates a default data table using AgGrid
//

const DEFAULT_ROW_HEIGHT = 40

const DataTable: React.FC<IDataTableProps> = ({
  tableData,
  isLoading,
  metadata,
  rowHeight = DEFAULT_ROW_HEIGHT,
  onDragStopped,
}) => {
  const gridApi = useRef<GridApi | null>(null)
  const [editValue, setEditValue] = useState<any>(null)
  // shift key is useful for on blur - whether to deselect rows or not
  const [isHoldingShiftKey, setIsHoldingShiftKey] = useState(false)
  const company = useCompany()

  // set context id on mount (must be unique for right click events)
  // https://github.com/fkhadra/react-contexify/issues/115
  const [context_id] = useState(makeShortid())

  // keep track of whether the user is holding down shift or not
  // this allows the user to select multiple rows when holding shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsHoldingShiftKey(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsHoldingShiftKey(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const [selectedCustomerJourney, setSelectedCustomerJourney] = useState<
    undefined | { customer?: string; customerKind?: string; table: string }
  >()

  const handleCloseDrawer = () => {
    setSelectedCustomerJourney(undefined)
  }

  useEffect(() => {
    // show and hide the loading overlay
    if (gridApi) {
      if (isLoading) {
        gridApi.current?.showLoadingOverlay()
      } else {
        gridApi.current?.hideOverlay()
      }
    }
  }, [isLoading])

  // generate columns from table data
  const getColumns = useCallback(() => {
    let columnDefs: ColDef[] = []
    const { columns } = tableData

    if (company && !_.isEmpty(columns)) {
      let formatter: ValueFormatter | undefined = undefined
      let linkColumns: string[] | undefined = undefined

      const columnMappings = columns.map((column) => {
        return { label: column.name, format: column.format || 'string' }
      })

      // always check for links, even if no format came in
      linkColumns = findLinkColumns(columnMappings, tableData.rows)

      if (columns[0].format) {
        // if original columns had a format make a formatter
        formatter = new ValueFormatter(columnMappings, company.currency_used)
      }

      columnDefs = columns.map((column) => {
        const headerWords = (column.displayName && column.displayName.split(' ').length) || 0
        const isLinkColumn = _.includes(linkColumns, column.name)

        // always check for customer column and add an icon for customer journey drawer
        const isCustomerColumn = metadata?.customer_column === column.name

        let cellRenderer // defaults to undefined (let ag-grid do its thing)
        if (isLinkColumn) {
          cellRenderer = LinkCellRenderer
        }

        if (isCustomerColumn) {
          cellRenderer = CustomerCellRenderer
        }

        return {
          headerName: column.displayName || column.friendly_name || column.name,
          field: column.name,
          tooltipField: column.name,
          valueFormatter: formatter?.getFormatter(column.name),
          type: column.type && NUMBER_COLUMN_TYPES.includes(column.type) ? 'numericColumn' : undefined, // numeric columns are right-aligned
          pinned: column.pinned,
          minWidth: headerWords > 2 ? headerWords * 30 : undefined, // longer header names need a bigger min width to not wrap 3, 4, 5 lines tall
          cellRenderer,
        }
      })
    }

    return columnDefs
  }, [tableData, metadata, company])

  const columnDefs = useMemo(() => getColumns(), [getColumns]) // only recompute columns when the table data changes

  const sizeColumnsToFit = useCallback(() => {
    if (columnDefs.length <= 12) {
      gridApi.current?.sizeColumnsToFit()
    }
  }, [columnDefs])

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
      id: context_id,
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

  return (
    <Suspense fallback={null}>
      <CustomerJourneyDrawer onClose={handleCloseDrawer} {...selectedCustomerJourney} />

      <GridContainer
        className="ag-theme-balham"
        onBlur={() => {
          // only blur if the user is not holding shift
          // this allows them to select multiple rows
          if (!isHoldingShiftKey) {
            gridApi.current?.deselectAll()
          }
        }}
        onContextMenu={(e) => e.preventDefault()} // to disable default browser menu popup anywhere in the grid
        rowHeight={rowHeight}
      >
        <GridContextMenu menuId={context_id} />

        <AgGrid
          animateRows
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            editable: true,
            minWidth: 70,
          }}
          enableBrowserTooltips
          gridOptions={{ context: { company, metadata, setSelectedCustomerJourney }, onDragStopped }}
          headerHeight={rowHeight}
          onCellContextMenu={onCellContextMenu}
          onCellEditingStarted={(params: CellEditingStartedEvent) => setEditValue(params.value)}
          onCellValueChanged={(params: CellValueChangedEvent) => {
            if (editValue) {
              params.node.setDataValue(params.column.getColId(), editValue)
              setEditValue(null)
            }
          }}
          onGridReady={(params) => {
            gridApi.current = params.api
            sizeColumnsToFit()
          }}
          onRowDataUpdated={sizeColumnsToFit}
          rowData={tableData ? tableData.rows : []}
          rowHeight={rowHeight}
          rowSelection="multiple"
          // suppressFieldDotNotation: don't allow nested field references in field names
          // otherwise fields like: 'max(cast(w.week as timestamp))' will break
          suppressFieldDotNotation
        />
      </GridContainer>
    </Suspense>
  )
}

export default DataTable
