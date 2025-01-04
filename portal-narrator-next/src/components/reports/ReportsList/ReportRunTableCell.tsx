import { Badge } from '@/components/primitives/Badge'
import { TableCell } from '@/components/primitives/Table'
import { useCompany } from '@/stores/companies'
import { IRemoteReport } from '@/stores/reports/interfaces'
import { isDateBefore } from '@/util/date'
import { formatDistanceToNow } from '@/util/formatters'

interface Props {
  report: IRemoteReport
}

export default function ReportRunTableCell({ report }: Props) {
  const timezone = useCompany((state) => state.timezone)
  const { lastRun, scheduled } = report
  const willRunInTheFuture = lastRun ? isDateBefore(lastRun.createdAt, new Date()) : false

  return (
    <TableCell>
      {scheduled && lastRun ? (
        <Badge color={willRunInTheFuture ? 'yellow' : 'lime'}>
          {formatDistanceToNow(lastRun.createdAt, { timeZone: timezone })}
        </Badge>
      ) : (
        <Badge color="gray">Not scheduled</Badge>
      )}
    </TableCell>
  )
}
