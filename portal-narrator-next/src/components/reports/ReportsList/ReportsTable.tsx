'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/primitives/Table'
import { useCompany } from '@/stores/companies'
import { IRemoteReport } from '@/stores/reports/interfaces'
import { formatDate } from '@/util/formatters'

import ReportActionsTableCell from './ReportActionsTableCell'
import ReportRunTableCell from './ReportRunTableCell'

interface Props {
  reports: IRemoteReport[]
}

export default function ReportsTable({ reports }: Props) {
  const [companySlug, timezone] = useCompany((state) => [state.slug, state.timezone])

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Created At</TableHeader>
          <TableHeader>Run</TableHeader>
          <TableHeader></TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {reports.map((report) => (
          <TableRow href={`/v2/${companySlug}/reports/${report.id}`} key={report.id}>
            <TableCell>{report.name}</TableCell>
            <TableCell>{formatDate(report.createdAt.toString(), { timeZone: timezone })}</TableCell>
            <ReportRunTableCell report={report} />
            <ReportActionsTableCell report={report} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
