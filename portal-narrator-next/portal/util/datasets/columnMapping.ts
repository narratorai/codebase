import { makeUnGroupedColumnSelectOptions, ALL_COLUMN_TYPES } from '.'
import { IColumn } from './interfaces'

export const getAllColumns = ({ formValue, groupSlug }: { formValue: object; groupSlug: string | null }): IColumn[] => {
  return makeUnGroupedColumnSelectOptions({
    formValue,
    columnTypes: ALL_COLUMN_TYPES,
    groupSlug,
  }).map((column) => {
    return {
      label: column.label,
      id: column.value,
      type: column.column.type,
    }
  })
}
