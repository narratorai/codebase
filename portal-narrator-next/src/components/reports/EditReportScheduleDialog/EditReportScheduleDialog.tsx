import { Dialog, DialogBody, DialogDescription, DialogTitle } from '@/components/primitives/Dialog'
import { IRemoteReport } from '@/stores/reports/interfaces'

import ReportScheduleForm, { ReportScheduleFormData } from './ReportScheduleForm'

interface Props {
  onChange: (data: ReportScheduleFormData) => Promise<void>
  onClose: () => void
  open: boolean
  report: IRemoteReport
}

export default function EditReportScheduleDialog({ open, onChange, onClose }: Props) {
  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Edit schedule</DialogTitle>
      <DialogDescription>
        The report will be automatically run at the specified schedule. Use cron syntax to specify the schedule.
      </DialogDescription>
      <DialogBody>
        <ReportScheduleForm onCancel={onClose} onSubmit={onChange} />
      </DialogBody>
    </Dialog>
  )
}
