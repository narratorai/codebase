import { ClockIcon, EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useToggle } from 'react-use'

import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/primitives/Dropdown'
import { IRemoteReport } from '@/stores/reports/interfaces'

import EditReportScheduleDialog from '../EditReportScheduleDialog/EditReportScheduleDialog'
import { ReportScheduleFormData } from '../EditReportScheduleDialog/ReportScheduleForm'
import { useDeleteReportMutation, useUpdateReportScheduleMutation } from './hooks'

interface Props {
  report: IRemoteReport
}

export default function MoreReportActionsDropdown({ report }: Props) {
  const [showScheduleDialog, toggleShowScheduleDialog] = useToggle(false)
  const { mutate: deleteReport, isPending: isDeletePending } = useDeleteReportMutation(report)
  const { mutate: updateReportSchedule } = useUpdateReportScheduleMutation(report)

  const handleReportScheduleChange = async (data: ReportScheduleFormData) => {
    await updateReportSchedule(data)
  }

  return (
    <>
      <Dropdown>
        <DropdownButton plain>
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu>
          <DropdownItem onClick={toggleShowScheduleDialog}>
            <ClockIcon />
            Schedule
          </DropdownItem>
          <DropdownItem disabled={isDeletePending} onClick={() => deleteReport()}>
            <TrashIcon />
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <EditReportScheduleDialog
        onChange={handleReportScheduleChange}
        onClose={toggleShowScheduleDialog}
        open={showScheduleDialog}
        report={report}
      />
    </>
  )
}
