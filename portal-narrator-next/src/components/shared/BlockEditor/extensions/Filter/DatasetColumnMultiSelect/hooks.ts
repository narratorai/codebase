import { produce } from 'immer'
import { isEmpty, isNil } from 'lodash'
import { useMemo } from 'react'

import { useReportDatasetsQuery } from '../hooks'
import { SelectionItem } from './DatasetColumnMultiSelectMenu'

function getFilteredItems(allItems: SelectionItem[], selectedItems: SelectionItem[], inputValue?: string) {
  const sharedType = selectedItems.length > 0 ? selectedItems[0].type : undefined
  const nonSelectedItems = allItems.filter((item) =>
    !selectedItems.map((item) => item.id).includes(item.id) && sharedType ? item.type === sharedType : true
  )

  if (isNil(inputValue) || isEmpty(inputValue)) return nonSelectedItems
  return nonSelectedItems.filter((item) => item.label?.toLowerCase().includes(inputValue.toLowerCase()))
}

export function useFilteredItems(allItems: SelectionItem[], value: SelectionItem[], inputValue?: string) {
  const filteredItems = useMemo(() => getFilteredItems(allItems, value, inputValue), [value, inputValue, allItems])
  return filteredItems
}

/**
 * Hook to fetch all dataset columns that are referenced in a report.
 * @param reportId
 */
export function useReportDatasetColummnsQuery(reportId: string) {
  const { data: response, ...state } = useReportDatasetsQuery(reportId)

  const allColumns = produce<SelectionItem[]>([], (draft) => {
    for (const dataset of response ?? []) {
      for (const tab of dataset.allTabs) {
        for (const column of tab.columns) {
          draft.push({
            id: column.id,
            label: column.label,
            type: column.type,
            dataset: { id: dataset.id, name: dataset.name },
            tab: { slug: tab.slug, label: tab.label, kind: tab.kind },
          })
        }
      }
    }
  })

  return { data: allColumns, ...state }
}
