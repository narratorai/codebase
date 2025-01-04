import { Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { useGetLastRunTransformationSubscription } from 'graph/generated'
import _ from 'lodash'
import React from 'react'
import { nextTimeFromCron, timeFromNow } from 'util/helpers'

import JobExecutionErrors from './JobExecutionErrors'

const TransformationStats = () => {
  const company = useCompany()
  const { data: lastRunData, loading: lastRunLoading } = useGetLastRunTransformationSubscription({
    variables: { company_slug: company.slug },
  })

  // Get last run_transformations task execution
  const lastTaskExecution = _.get(lastRunData, 'task_execution[0]', {})
  const lastExecutionLabel = lastTaskExecution.completed_at
    ? timeFromNow(lastTaskExecution.completed_at)
    : lastTaskExecution.status
  const nextExecutionLabel = _.isEmpty(lastTaskExecution)
    ? 'N/A'
    : nextTimeFromCron(lastTaskExecution.task.schedule, company?.timezone, lastTaskExecution.task.created_at)

  return (
    <Spin spinning={lastRunLoading}>
      <Box my={2} p={2} bg="yellow100">
        <Box mb={1}>
          <Typography color="yellow600">Last transformation processed</Typography>
          <Typography color="yellow900" type={!lastTaskExecution.completed_at ? 'warning' : undefined}>
            {lastExecutionLabel}
          </Typography>
        </Box>
        <Box mb={1}>
          <Typography color="yellow600">Next Activity Stream update</Typography>
          <Typography color="yellow900">{nextExecutionLabel}</Typography>
        </Box>
        <Box>
          <Typography color="yellow600">Run Transformation Status</Typography>
          <Typography color="yellow900">{lastTaskExecution.status}</Typography>
        </Box>
      </Box>

      {lastTaskExecution.status === 'failed' && <JobExecutionErrors taskExecutionId={lastTaskExecution.id} />}
    </Spin>
  )
}

export default TransformationStats
