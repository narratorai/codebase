import { useMutation, useQuery } from '@tanstack/react-query'

import { useSearchParams } from '@/hooks'
import { useCompany } from '@/stores/companies'
import { useReports } from '@/stores/reports'
import { IRemoteReport } from '@/stores/reports/interfaces'

export function useReportsQuery() {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const [reports, getAll] = useReports((state) => [state.data, state.getAll])
  const [searchParams] = useSearchParams()

  const { data, ...state } = useQuery({
    queryFn: () => getAll(searchParams as Record<string, string>, datacenterRegion),
    queryKey: [companySlug, 'reports', searchParams],
  })

  return {
    data: reports,
    ...state,
  }
}

export function useReportFavoriteMutation(report: IRemoteReport) {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [favoriteReport, unfavoriteReport] = useReports((state) => [state.favoriteReport, state.unfavoriteReport])

  return useMutation({
    mutationFn: async () => {
      if (!report.id) throw new Error('Report ID is missing')

      if (report.favorited) await unfavoriteReport(report.id, datacenterRegion)
      else await favoriteReport(report.id, datacenterRegion)
    },
  })
}

export function useDeleteReportMutation(report: IRemoteReport) {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [deleteReport] = useReports((state) => [state.deleteReport])

  return useMutation({
    mutationFn: async () => {
      if (!report.id) throw new Error('Report ID is missing')

      await deleteReport(report.id, datacenterRegion)
    },
  })
}

export function useUpdateReportScheduleMutation(report: IRemoteReport) {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [updateReportSchedule] = useReports((state) => [state.updateReportSchedule])

  return useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (!report.id) throw new Error('Report ID is missing')

      await updateReportSchedule(report.id, data, datacenterRegion)
    },
  })
}
