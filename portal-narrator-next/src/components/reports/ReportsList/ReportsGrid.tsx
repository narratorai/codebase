import { IRemoteReport } from '@/stores/reports/interfaces'

import ReportsListItem from './ReportsListItem'

interface Props {
  reports: IRemoteReport[]
}

export default function ReportsGrid({ reports }: Props) {
  return (
    <ul className="grid grid-flow-row gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {reports.map((report) => (
        <ReportsListItem key={report.id} report={report} />
      ))}
    </ul>
  )
}
