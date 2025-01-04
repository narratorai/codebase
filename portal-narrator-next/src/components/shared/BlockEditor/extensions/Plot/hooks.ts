import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tiptap/core'

import { useCompany } from '@/stores/companies'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'
import ReportsRepository from '@/stores/reports/ReportsRepository'

import { useEditorFiltersAttrs } from '../Filter'
import { PlotFormData } from './PlotForm'

export type PlotNodeAttrs = {
  uid: string
  height: number
  width: string
  textAlign: 'left' | 'center' | 'right'
} & PlotFormData

const repository = new ReportsRepository()

/**
 * Hook to compile a plot node.
 *
 * @param compileContextx
 * @param attrs Prosemirror node attributes
 */
export function useCompileQuery(editor: Editor, compileContext: IReportNodeCompileContext, attrs: PlotNodeAttrs) {
  const { datacenterRegion, slug: companySlug } = useCompany()
  const filtersAttrs = useEditorFiltersAttrs(editor)

  const { reportId, ...runDetails } = compileContext
  const payload = { node: { attrs, type: 'plot' }, runDetails }
  const queryKey = [companySlug, 'reports', reportId, 'nodes/plot', JSON.stringify({ filtersAttrs, payload })]

  const state = useQuery({
    queryFn: () => repository.compileNode(reportId, payload, filtersAttrs, datacenterRegion),
    queryKey,
    retry: false,
    staleTime: 1_000 * 60 * 5,
  })

  return state
}
