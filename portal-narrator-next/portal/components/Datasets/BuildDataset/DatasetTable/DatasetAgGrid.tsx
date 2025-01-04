import { ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import React, { ForwardedRef, forwardRef, RefObject, useMemo } from 'react'
import styled from 'styled-components'
import { SCROLLBAR_WIDTH } from 'util/datasets/constants'

const AgGrid = React.lazy(() => import(/* webpackChunkName: "ag-grid" */ 'components/shared/DataTable/AgGrid'))

const GridWrapper = styled.div`
  height: 100%;
  width: 100%;

  && .ag-root-wrapper {
    border: none;
    border-radius: 0;
  }

  .ag-header .ag-header-cell {
    padding: 0;
  }

  .ag-react-container {
    width: 100%;
  }

  .activity-group {
    color: white;
  }

  .row-num-group {
    background: white;
  }

  /* color variable overrides */

  /* data color is the color of the content of the cells -- the table data */
  --ag-data-color: ${(props) => props.theme.colors.gray700};
  --ag-odd-row-background-color: ${(props) => props.theme.colors.gray100};
  --ag-header-foreground-color: ${(props) => props.theme.colors.black};
  --ag-header-background-color: ${(props) => props.theme.colors.white};

  /* override the ag-grid css theme */
  && {
    font-family: ${(props) => props.theme.fonts.sans};

    /* header styles */

    .ag-header {
      border-bottom-color: ${(props) => props.theme.colors.gray200};
    }

    .ag-header-group-cell {
      padding: 0;
    }

    /* stylelint-disable-next-line no-descending-specificity */
    .ag-header-cell {
      border-style: none !important;
      font-weight: normal;

      &::after {
        display: none !important;
      }
    }

    /* row styles */

    .ag-row:not(.ag-row-first) {
      border-top-style: none;
    }

    .ag-row:not(.ag-row-last) {
      border-bottom-style: none;
    }

    /* cell styles */

    .ag-cell-not-inline-editing {
      padding-top: 8px;
    }

    /* cell that spans multiple rows - always a group column */
    .cell-span {
      background-color: white;
      border-right: 1px solid ${(props) => props.theme.colors.gray200};
    }

    /* all cells, across the entire row, that are at the bottom of a spanned area */
    .spanned-cell-bottom {
      border-bottom: 1px solid ${(props) => props.theme.colors.gray300};
    }

    .ag-cell a {
      color: ${(props) => props.theme.colors.black};
    }

    .ag-cell-inline-editing {
      height: 100%;

      input.ag-input-field-input {
        border-style: none;
        height: 100%;
      }
    }
  }
`

const DEFAULT_COL_DEF = {
  resizable: true,
  sortable: true,
  editable: true,
  lockVisible: true,
}

interface AgGridProps {
  alignedGrids?: RefObject<AgGridReact>[]
  asHeader?: boolean
  columnDefs: (ColDef | ColGroupDef)[]
  components?: { [key: string]: any }
  defaultColDef?: ColDef
  gridOptions: GridOptions
  height?: number
  rowData: any[]
}

const DatasetAgGrid = (
  { columnDefs, gridOptions, rowData, height, components, defaultColDef = {}, asHeader, alignedGrids }: AgGridProps,
  ref: ForwardedRef<AgGridReact>
) => {
  const style = height ? { height: height } : undefined

  const colDefWithDefaults = useMemo(() => ({ ...DEFAULT_COL_DEF, ...defaultColDef }), [defaultColDef])

  return (
    <GridWrapper
      className="ag-theme-balham"
      data-test={asHeader ? 'dataset-table-header-wrapper' : 'dataset-table-body-wrapper'}
      onContextMenu={(e) => {
        // prevent native context menu (right click)
        e.preventDefault()
      }}
      style={style}
    >
      <AgGrid
        alignedGrids={alignedGrids}
        animateRows
        columnDefs={columnDefs}
        components={components}
        defaultColDef={colDefWithDefaults}
        enableBrowserTooltips
        gridOptions={gridOptions}
        ref={ref}
        rowData={rowData}
        rowSelection="multiple"
        scrollbarWidth={SCROLLBAR_WIDTH}
        suppressRowTransform // required for row spanning
      />
    </GridWrapper>
  )
}

export default forwardRef(DatasetAgGrid)
