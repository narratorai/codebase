import { useQuery } from '@tanstack/react-query'
import { JSONContent } from '@tiptap/core'

import { useCompany } from '@/stores/companies'
import { ContentAdapter, useReport } from '@/stores/reports'
import { IRemoteReportContentMeta } from '@/stores/reports/interfaces'

export function useReportQuery(reportId: string) {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const getReport = useReport((state) => state.get)

  const queryResult = useQuery({
    queryFn: () => getReport(reportId, datacenterRegion),
    queryKey: [companySlug, 'reports', reportId],
  })

  return queryResult
}

export function useStoredReport() {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [name, content, lastRun, saveContent, canEdit] = useReport((state) => [
    state.name,
    state.content,
    state.lastRun,
    state.saveContent,
    state.canEdit,
  ])

  const handleChange = async (
    value: JSONContent,
    meta: IRemoteReportContentMeta,
    textContent: string,
    firstNodeText?: string
  ) => {
    const content = ContentAdapter.formatJSONContent(value, textContent, meta)
    const updatedName = name === 'Untitled' ? firstNodeText : name

    await saveContent({ content, name: updatedName }, datacenterRegion)
  }

  return {
    canEdit,
    content,
    lastRun,
    name,
    onChange: handleChange,
  }
}
