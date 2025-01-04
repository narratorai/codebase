import { useCompany } from 'components/context/company/hooks'
import cronstrue from 'cronstrue'
import React from 'react'
import { cronValidator } from 'util/forms'
import { handleApproximateCron, timezoneAbbreviation } from 'util/helpers'

import Typography from '../Typography'

interface Props {
  crontab: string
  warning?: string
  task_created_at?: string
  includeTimezone?: boolean
}

// "0 0 */2 * *" --> "At 12:00 AM, every 2 days"
const CronTranslation = ({ crontab, warning, task_created_at, includeTimezone, ...props }: Props) => {
  const company = useCompany()

  if (cronValidator({ value: crontab })) {
    return (
      <Typography color="red500" {...props}>
        Enter valid cron tab
      </Typography>
    )
  }

  const { formattedCronTab } = handleApproximateCron(crontab, task_created_at)

  return (
    <>
      <Typography color="yellow700" {...props}>
        {warning ? warning : ''}
      </Typography>
      <Typography color="black">
        {cronstrue.toString(formattedCronTab)}
        {includeTimezone && company.timezone && (
          <span style={{ marginLeft: '4px' }}>({timezoneAbbreviation(company.timezone)})</span>
        )}
      </Typography>
    </>
  )
}

export default CronTranslation
