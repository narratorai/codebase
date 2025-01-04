import { INarrativeTableContentMetaData } from 'util/blocks/interfaces'
import { DragStoppedEvent } from '@ag-grid-community/core'

export interface ColumnConfig {
  name: string
  displayName?: string
  friendly_name?: string
  format?: string
  pinned?: 'left' | 'right' | null
  type?: string
}
export interface ITableData {
  columns: ColumnConfig[]
  rows: Record<string, any>[]
  retrievedAt?: string
}

export interface IDataTableProps {
  tableData: ITableData
  isLoading: boolean
  rowHeight?: number
  metadata?: INarrativeTableContentMetaData
  onDragStopped?: (event: DragStoppedEvent) => void
}

export type RowData = Record<string, string | number | null>
