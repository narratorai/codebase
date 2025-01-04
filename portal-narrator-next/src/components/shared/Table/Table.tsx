import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { AgGridReact } from '@ag-grid-community/react'
import clsx from 'clsx'

import { IRemoteDataTable } from '@/stores/datasets'

import { useColumnDefinitions, useColumnTypes, useGridOptions } from './hooks'

interface Props {
  className?: clsx.ClassValue
  height?: number
  table: IRemoteDataTable
}

const Table = ({ className, height, table }: Props) => {
  const columns = table.columns || []
  const rows = table.rows || []
  const gridOptions = useGridOptions()
  const columnDefs = useColumnDefinitions(columns)
  const columnTypes = useColumnTypes()

  return (
    <div className={clsx('ag-theme-custom w-full', className)} style={{ height }}>
      <AgGridReact
        columnDefs={columnDefs}
        columnTypes={columnTypes}
        gridOptions={gridOptions}
        modules={[ClientSideRowModelModule]}
        rowData={rows}
      />
    </div>
  )
}

export default Table
