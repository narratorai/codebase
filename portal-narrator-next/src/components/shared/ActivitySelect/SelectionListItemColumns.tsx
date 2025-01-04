import { map, slice } from 'lodash'
import React from 'react'

import { Label, Tag } from '@/components/shared/Tag'
import { IRemoteColumn } from '@/stores/activities'

import SelectionListItemColumnsPopover from './SelectionListItemColumnsPopover'

interface Props {
  columns: IRemoteColumn[]
  visibleCount?: number
}

const SelectionListItemColumns = ({ columns, visibleCount = Infinity }: Props) => {
  const visibleColumns = slice(columns, 0, visibleCount)
  const hiddenColumns = slice(columns, visibleCount)
  const showHiddenColumns = hiddenColumns.length > 0

  return (
    <div className="flex-wrap gap-2 flex-x-center">
      {map(visibleColumns, (column) => (
        <Tag size="lg" color="white" border key={column.id}>
          <Label>{column.label}</Label>
        </Tag>
      ))}
      {showHiddenColumns && <SelectionListItemColumnsPopover columns={hiddenColumns} />}
    </div>
  )
}

export default SelectionListItemColumns
