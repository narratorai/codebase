import { FieldTimeOutlined } from '@ant-design/icons'
import { Spin, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { useGetLastRunTransformationSubscription } from 'graph/generated'
import { get } from 'lodash'
import moment from 'moment-timezone'
import { colors } from 'util/constants'

interface Props {
  nextResync: string
}

const NextResyncIcon = ({ nextResync }: Props) => {
  const company = useCompany()
  const { data: lastRunData, loading: lastRunLoading } = useGetLastRunTransformationSubscription({
    variables: { company_slug: company.slug },
  })

  const lastTaskExecution = get(lastRunData, 'task_execution[0]', {})
  const lastRunTransformation = lastTaskExecution?.started_at
  const nextResyncGreater = moment(nextResync).isAfter(moment(lastRunTransformation))

  const tooltipTitle = nextResyncGreater ? (
    <Box>
      <Typography>
        The processing started before this transformation was triggered to resync, so this will start in the NEXT run.
      </Typography>
      <Typography>The run will be triggered automatically at the end.</Typography>
    </Box>
  ) : (
    'The processing is running and this transformation is yet to be started'
  )

  return (
    <Spin spinning={lastRunLoading}>
      <Tooltip title={lastRunTransformation ? tooltipTitle : undefined}>
        <FieldTimeOutlined style={{ color: colors.yellow500 }} />
      </Tooltip>
    </Spin>
  )
}

export default NextResyncIcon
