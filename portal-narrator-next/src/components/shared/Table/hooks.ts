import { ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useCompany } from '@/stores/companies'
import { IRemoteDataTableColumn } from '@/stores/datasets'

import { getColumnDefinitions, getColumnTypes } from './util'

export const useColumnDefinitions = (columns: IRemoteDataTableColumn[]) => {
  const columnDefs = useMemo<ColDef[] | ColGroupDef[]>(() => getColumnDefinitions(columns), [columns])

  return columnDefs
}

export const useColumnTypes = () => {
  return getColumnTypes()
}

export const useGridOptions = (): GridOptions => {
  const context = useCompany(
    useShallow((state) => ({
      currency: state.currency,
      timezone: state.timezone,
      locale: state.locale,
    }))
  )

  const defaultColDef = {
    resizable: true,
    sortable: true,
    editable: false,
    minWidth: 64,
  }

  return {
    context,
    defaultColDef,
    suppressFieldDotNotation: true,
    rowSelection: 'multiple',
    rowHeight: 44,
  }
}
