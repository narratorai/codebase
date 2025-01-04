import { useMutation } from '@tanstack/react-query'

import { useCompany } from '@/stores/companies'
import { useReports } from '@/stores/reports'

export function useDeleteReportMutation(reportId: string) {
  const [datacenterRegion] = useCompany((state) => [state.datacenterRegion])
  const deleteReport = useReports((state) => state.deleteReport)

  return useMutation({
    mutationFn: () => deleteReport(reportId, datacenterRegion),
  })
}
