import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tiptap/core'
import { useCombobox, useMultipleSelection } from 'downshift'
import { produce } from 'immer'
import { useMemo } from 'react'

import { useSearchParams } from '@/hooks'
import { useCompany } from '@/stores/companies'
import DatasetsRepository from '@/stores/datasets/DatasetsRepository'
import { FilterCompileResponse, IReportNodeCompileContext } from '@/stores/reports/interfaces'
import ReportsRepository from '@/stores/reports/ReportsRepository'
import { TDatacenterRegion } from '@/util/mavisClient/client'

import { FilterFormData } from './FilterForm'

export type FilterNodeAttrs = { uid: string } & FilterFormData
export type AppliedFilterNodeAttrs = { value: unknown } & FilterNodeAttrs

const reportRepository = new ReportsRepository()
const datasetRepository = new DatasetsRepository()

/**
 * Fetches all datasets that are referenced in a report and returns them
 * with only the tabs that are used in the report. Tabs contain all the columns.
 *
 * @param reportId
 * @param datacenterRegion
 */
async function fetchReferencedDatasets(reportId: string, datacenterRegion: TDatacenterRegion) {
  const { data: partialReferencedDatasets } = await reportRepository.getReferencedDatasets(reportId, datacenterRegion)
  const usedTabSlugs = partialReferencedDatasets.flatMap((item) => item.tabSlugs)
  const isTabUsed = (tab: { slug: string }) => usedTabSlugs.includes(tab.slug)

  // Since the GET /datasets/:id endpoint is the only way to get the columns of a tab,
  // we need to fetch each dataset referenced in the report.
  const datasetPromises = partialReferencedDatasets.map((item) =>
    datasetRepository.getById(item.dataset.id, datacenterRegion)
  )
  const referencedDatasets = await Promise.all(datasetPromises)

  // Filter out the tabs that are not used in the report
  const filteredDatasets = produce(referencedDatasets, (draft) => {
    draft.forEach((result) => {
      result.allTabs = result.allTabs.filter(isTabUsed)
    })
  })

  return filteredDatasets
}

/**
 * Query hook to fetch all datasets that are referenced in a report.
 * @param reportId
 */
export function useReportDatasetsQuery(reportId: string) {
  const { slug: companySlug, datacenterRegion } = useCompany()

  const state = useQuery({
    queryKey: [companySlug, 'reports', reportId, 'datasets'],
    queryFn: () => fetchReferencedDatasets(reportId, datacenterRegion),
    staleTime: 1_000 * 60,
    retry: false,
  })

  return state
}

/**
 * Hook to compile a filter node.
 *
 * @param compileContext
 * @param attrs Prosemirror node attributes
 */
export function useCompileQuery(compileContext: IReportNodeCompileContext, attrs: FilterNodeAttrs) {
  const { slug: companySlug, datacenterRegion } = useCompany()

  const { reportId, ...runDetails } = compileContext
  const payload = { node: { type: 'filter', attrs }, runDetails }
  const queryKey = [companySlug, 'reports', reportId, 'nodes/filter', JSON.stringify(payload)]

  const state = useQuery({
    queryKey,
    queryFn: () => reportRepository.compileNode<FilterCompileResponse>(reportId, payload, [], datacenterRegion),
    staleTime: 1_000 * 60 * 5,
    retry: false,
  })

  return state
}

/**
 * Hook to retrieve all attrs from filter nodes in the editor.
 *
 * @param editor Prosemirror editor instance
 */
export function useEditorFiltersAttrs(editor: Editor) {
  const [searchParams] = useSearchParams()

  const filtersAttrs = useMemo(() => {
    if (!editor.isInitialized) return []

    const filterNodes = editor.$nodes('filter')?.map((pos) => pos.node) || []

    return filterNodes.map((node) => {
      const attrs = node.attrs as FilterNodeAttrs
      const filterSearchParam = (searchParams[attrs.uid] || {}) as Record<string, unknown>

      return { ...attrs, value: filterSearchParam.value } as AppliedFilterNodeAttrs
    })
  }, [editor.isInitialized, editor.state.toJSON(), searchParams])

  return filtersAttrs
}

export function useMultipleSelect<T>(args: {
  items: T[]
  selectedItems: T[]
  inputValue: string | undefined
  setInputValue: (value?: string) => void
  onChange: (value: T[]) => void
}) {
  const { items, selectedItems, inputValue, setInputValue, onChange } = args
  const { getSelectedItemProps, getDropdownProps, removeSelectedItem, addSelectedItem } = useMultipleSelection<T>({
    selectedItems,
    onSelectedItemsChange: ({ selectedItems }) => {
      onChange(selectedItems)
    },
  })

  const comboboxProps = useCombobox<T>({
    items,
    inputValue,
    selectedItem: undefined,
    onStateChange({ inputValue: newInputValue, type, selectedItem }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          if (!selectedItem) break

          if (selectedItems.includes(selectedItem)) removeSelectedItem(selectedItem)
          else addSelectedItem(selectedItem)
          setInputValue('')

          break
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(newInputValue)
          break
        default:
          break
      }
    },
    stateReducer(state, actionAndChanges) {
      const { changes, type } = actionAndChanges

      switch (type) {
        case useCombobox.stateChangeTypes.FunctionSelectItem:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: state.isOpen,
            highlightedIndex: state.highlightedIndex,
          }
        case useCombobox.stateChangeTypes.InputBlur:
          return {
            ...changes,
            isOpen: false,
          }
        default:
          return changes
      }
    },
  })

  return { ...comboboxProps, getSelectedItemProps, getDropdownProps, removeSelectedItem }
}
