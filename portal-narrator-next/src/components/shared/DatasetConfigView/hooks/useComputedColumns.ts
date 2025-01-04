import { filter } from 'lodash'
import { useMemo } from 'react'

import { IRemoteParentColumn } from '@/stores/datasets'

import { compileParentColumns } from '../util'

const useComputedColumns = (columns: IRemoteParentColumn[]) => {
  const result = useMemo(() => {
    const computedColumns = filter(columns, (column) => column.details.kind === 'computed')
    if (computedColumns.length === 0) return []
    return compileParentColumns(computedColumns)
  }, [columns])

  return result
}

export default useComputedColumns
