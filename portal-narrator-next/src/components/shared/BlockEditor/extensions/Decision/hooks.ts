import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tiptap/core'

import { useCompany } from '@/stores/companies'
import { DecisionCompileResponse, IReportNodeCompileContext } from '@/stores/reports/interfaces'
import ReportsRepository from '@/stores/reports/ReportsRepository'

import { useEditorFiltersAttrs } from '../Filter'
import { DecisionFormData } from './DecisionForm'

export type DecisionNodeAttrs = { uid: string } & DecisionFormData
export type AppliedFilterNodeAttrs = { value: unknown } & DecisionNodeAttrs

const repository = new ReportsRepository()

/**
 * Hook to compile a decision node.
 *
 * @param editor
 * @param compileContext
 * @param attrs Prosemirror node attributes
 */
export function useCompileQuery(editor: Editor, compileContext: IReportNodeCompileContext, attrs: DecisionNodeAttrs) {
  const { slug: companySlug, datacenterRegion } = useCompany()
  const filtersAttrs = useEditorFiltersAttrs(editor)

  const { reportId, ...runDetails } = compileContext
  const payload = { node: { type: 'decision', attrs }, runDetails }
  const queryKey = [companySlug, 'reports', reportId, 'nodes/decision', JSON.stringify({ payload, filtersAttrs })]

  const state = useQuery<DecisionCompileResponse>({
    queryKey,
    queryFn: () => repository.compileNode(reportId, payload, filtersAttrs, datacenterRegion),
    staleTime: 1_000 * 60 * 5,
    retry: false,
  })

  return state
}
