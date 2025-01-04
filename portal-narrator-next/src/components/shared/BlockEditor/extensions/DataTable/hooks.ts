import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tiptap/core'

import { useCompany } from '@/stores/companies'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'
import ReportsRepository from '@/stores/reports/ReportsRepository'

import { useEditorFiltersAttrs } from '../Filter'
import { DataTableFormData } from './DataTableForm'

export type DataTableNodeAttrs = {
  uid: string
  height: number
  width: string
  textAlign: 'left' | 'center' | 'right'
} & DataTableFormData

const repository = new ReportsRepository()

/**
 * Hook to compile a data table node.
 *
 * @param editor
 * @param compileContext
 * @param attrs Prosemirror node attributes
 */
export function useCompileQuery(editor: Editor, compileContext: IReportNodeCompileContext, attrs: DataTableNodeAttrs) {
  const { slug: companySlug, datacenterRegion } = useCompany()
  const filtersAttrs = useEditorFiltersAttrs(editor)

  const { reportId, ...runDetails } = compileContext
  const payload = { node: { type: 'dataTable', attrs }, runDetails }
  const queryKey = [companySlug, 'reports', reportId, 'nodes/dataTable', JSON.stringify({ payload, filtersAttrs })]

  const state = useQuery({
    queryKey,
    queryFn: () => repository.compileNode(reportId, payload, filtersAttrs, datacenterRegion),
    staleTime: 1_000 * 60 * 5,
    retry: false,
  })

  return state
}
