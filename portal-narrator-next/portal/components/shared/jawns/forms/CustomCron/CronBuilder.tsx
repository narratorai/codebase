import { useCompany } from 'components/context/company/hooks'
import { Box, CronTranslation, Typography } from 'components/shared/jawns'
import { isString } from 'lodash'
import { useField } from 'react-final-form'
import { nextTimeFromCron } from 'util/helpers'

import { handleTimeToCron } from './helpers'

const CronBuilder = () => {
  const company = useCompany()

  const {
    input: { value: segmentation },
  } = useField('segmentation')

  const {
    input: { value: frequency },
  } = useField('frequency')

  const {
    input: { value: minute_of_hour },
  } = useField('minute_of_hour')

  const {
    input: { value: starts_on_hour },
  } = useField('starts_on_hour')

  const {
    input: { value: repeats_at },
  } = useField('repeats_at')

  const {
    input: { value: repeats_on_week_days },
  } = useField('repeats_on_week_days')

  const {
    input: { value: repeats_on_month_days },
  } = useField('repeats_on_month_days')

  const {
    input: { value: starts_on_month },
  } = useField('starts_on_month')

  const cronTab = handleTimeToCron({
    frequency,
    segmentation,
    minute_of_hour,
    starts_on_hour,
    repeats_at,
    repeats_on_week_days,
    repeats_on_month_days,
    starts_on_month,
  })

  if (!isString(cronTab)) {
    return null
  }

  const nextRun = nextTimeFromCron(cronTab, company?.timezone)

  return (
    <Box mt={2}>
      <CronTranslation crontab={cronTab} />
      <Typography mt={1}>Next run: {nextRun}</Typography>
    </Box>
  )
}

export default CronBuilder
