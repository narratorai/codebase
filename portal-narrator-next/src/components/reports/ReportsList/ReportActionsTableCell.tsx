import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/20/solid'
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline'

import { Button } from '@/components/primitives/Button'
import { TableCell } from '@/components/primitives/Table'
import { IRemoteReport } from '@/stores/reports/interfaces'

import { useReportFavoriteMutation } from './hooks'
import MoreReportActionsDropdown from './MoreReportActionsDropdown'

interface Props {
  report: IRemoteReport
}

export default function ReportActionsTableCell({ report }: Props) {
  const { favorited } = report
  const { mutate: toggleFavorite, isPending } = useReportFavoriteMutation(report)

  const handleToggleFavorite = async () => {
    await toggleFavorite()
  }

  return (
    <TableCell>
      <div className="space-x-2 flex-x-center">
        <Button disabled={isPending} onClick={handleToggleFavorite} plain>
          {favorited ? <BookmarkIconSolid /> : <BookmarkIconOutline />}
        </Button>
        <MoreReportActionsDropdown report={report} />
      </div>
    </TableCell>
  )
}
