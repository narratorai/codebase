import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import {
  CellContextMenuEvent,
  CellEditingStartedEvent,
  CellValueChangedEvent,
  ColDef,
  GridApi,
} from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import '@ag-grid-community/core/dist/styles/ag-grid.css'
import '@ag-grid-community/core/dist/styles/ag-theme-balham.css'

// Ag grid has a lot of nice things out of the box
// - row virtualization
// - column (multi) sorting, reordering, resizing
// - row selection
// Unfortunately the free version does not provide copying of cell values
// so we'll have to write that ourselves

import { IDataTableProps } from './DataTable'

const copyToClipboard = (str: string) => {
  const el = document.createElement('textarea')
  el.value = str
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

const AgGrid = ({ tableData, isLoading }: IDataTableProps) => {
  // only recompute columns when the table data changes
  const columnDefs = useMemo(() => getColumns(), [tableData])
  const gridApi = useRef<GridApi | null>(null)
  const [editValue, setEditValue] = useState<any>(null)

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
  function getColumns() {
    let columnDefs: ColDef[] = []

    if (tableData) {
      columnDefs = tableData.columns.map((column: string) => {
        return {
          headerName: column,
          field: column,
          tooltipField: column, // turn on browser tooltips
        }
      })
    }

    return columnDefs
  }

  return (
    <div
      className="ag-theme-balham"
      style={{
        height: '100%',
        width: '100%',
      }}
      onContextMenu={(e) => e.preventDefault()} // to disable default browser menu popup anywhere in the grid
    >
      <AgGridReact
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          editable: true,
        }}
        rowSelection="single"
        rowData={tableData ? tableData.rows : []}
        modules={[ClientSideRowModelModule]}
        enableBrowserTooltips={true}
        animateRows={true}
        onGridReady={(params) => {
          gridApi.current = params.api
        }}
        onCellContextMenu={(params: CellContextMenuEvent) => copyToClipboard(params.value)}
        onCellValueChanged={(params: CellValueChangedEvent) => {
          if (editValue) {
            params.node.setDataValue(params.column.getColId(), editValue)
            setEditValue(null)
          }
        }}
        onCellEditingStarted={(params: CellEditingStartedEvent) => setEditValue(params.value)}
      ></AgGridReact>
    </div>
  )
}

export default AgGrid
