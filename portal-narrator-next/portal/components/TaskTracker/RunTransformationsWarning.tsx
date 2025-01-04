import { Alert } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import React from 'react'

interface Props {
  taskSlug: string
  schedule: string
}

const RUN_TRANSFORMATIONS_SLUG = 'run_transformations'
const SCHEDULE_OVERRIDE_CRON = '*/9 * * * *'

// We change the schedule to "*/9 * * * *" when resyncing large transformations
// This component surfaces a warning letting the user know
const RunTransformationsWarning: React.FC<Props> = ({ taskSlug, schedule }) => {
  // only show the warning for "run_transformations"
  if (taskSlug !== RUN_TRANSFORMATIONS_SLUG) {
    return null
  }

  // only show warning for "*/9 * * * *"
  if (schedule !== SCHEDULE_OVERRIDE_CRON) {
    return null
  }

  // show warning for run_transformations with "*/9 * * * *" schedule
  return (
    <Box mt={1}>
      <Alert
        type="warning"
        message={
          <Box>
            <Typography>A large transformation is resyncing.</Typography>
            <Typography>
              We automatically changed the scheduler to <span style={{ fontWeight: 'bold' }}>every 9 minutes</span> so
              your data catches up quickly.
            </Typography>
            <Typography>We will change back to your original schedule after we're done resyncing.</Typography>
          </Box>
        }
      />
    </Box>
  )
}

export default RunTransformationsWarning
