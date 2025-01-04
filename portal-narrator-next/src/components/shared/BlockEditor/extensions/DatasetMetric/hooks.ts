import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tiptap/core'

import { useCompany } from '@/stores/companies'
import { DatasetMetricCompileResponse, IReportNodeCompileContext } from '@/stores/reports/interfaces'
import ReportsRepository from '@/stores/reports/ReportsRepository'

import { useEditorFiltersAttrs } from '../Filter'
import { DatasetMetricFormData } from './DatasetMetricForm'

export type DatasetMetricNodeAttrs = { uid: string; height: number } & DatasetMetricFormData

const repository = new ReportsRepository()

/**
 * Hook to compile a metric node.
 *
 * @param compileContextx
 * @param attrs Prosemirror node attributes
 */
export function useCompileQuery(
  editor: Editor,
  compileContext: IReportNodeCompileContext,
  attrs: DatasetMetricNodeAttrs
) {
  const { datacenterRegion, slug: companySlug } = useCompany()
  const filtersAttrs = useEditorFiltersAttrs(editor)

  const { reportId, ...runDetails } = compileContext
  const payload = { node: { attrs, type: 'datasetMetric' }, runDetails }
  const queryKey = [companySlug, 'reports', reportId, 'nodes/datasetMetric', JSON.stringify({ filtersAttrs, payload })]

  const state = useQuery({
    queryFn: () =>
      repository.compileNode<DatasetMetricCompileResponse>(reportId, payload, filtersAttrs, datacenterRegion),
    queryKey,
    retry: false,
    staleTime: 1_000 * 60 * 5,
  })

  return state
}
