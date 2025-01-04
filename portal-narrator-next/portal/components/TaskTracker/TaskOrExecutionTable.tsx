import { BellOutlined, MessageOutlined } from '@ant-design/icons'
import { App, Button } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { PlotTimes } from 'components/TaskTracker/interfaces'
import JobExecutionErrors from 'components/Transformations/JobExecutionErrors'
import {
  ICompany_Task,
  useCreateCompanyTaskWatcherMutation,
  useDeleteCompanyTaskWatcherMutation,
} from 'graph/generated'
import { isEmpty, map, startCase } from 'lodash'
import { useEffect } from 'react'
import styled from 'styled-components'
import { formatTimeStamp, getFormattedTimeDiff, getLocalTimezone, timeFromNow } from 'util/helpers'

import { TASK_CATEGORY_PROCESSING } from './services/constants'
import { IHoneyCombLink, makeTaskOrExecutionSupportDescription, prefillDescriptionSupport } from './services/helpers'

interface Props {
  id: string
  task?: Partial<ICompany_Task>
  execution?: any
  startedAt: string
  completedAt: string
  type: 'execution' | 'task'
  status: string
  honeycombLinks?: IHoneyCombLink[]
  isSubscribed: boolean
  refetchWatchers?: Function
  plotTime?: PlotTimes
}

const StyledTableData = styled.td`
  min-width: 104px;
  padding-top: 4px;
  padding-bottom: 4px;
  border-bottom: solid 1px ${(props) => props.theme.colors['gray400']};
`

const StyledTableBottomData = styled.td`
  min-width: 104px;
  padding-top: 4px;
  padding-bottom: 4px;
`

const TaskOrExecutionTable = ({
  id,
  task,
  execution,
  startedAt,
  completedAt,
  type,
  status,
  honeycombLinks,
  isSubscribed,
  refetchWatchers,
  plotTime,
}: Props) => {
  const { notification } = App.useApp()
  const { isSuperAdmin, user } = useUser()
  const company = useCompany()

  const [createCompanyTaskWatcherMutation, { data: createWatcherData, error: createWatcherError }] =
    useCreateCompanyTaskWatcherMutation({
      variables: {
        user_id: user?.id,
        task_id: task?.id,
      },
    })

  const [deleteCompanyTaskWatcherMutation, { data: deleteWatcherData, error: deleteWatcherError }] =
    useDeleteCompanyTaskWatcherMutation({
      variables: {
        user_id: user?.id,
        task_id: task?.id,
      },
    })

  // success creating/deleting watcher notifications
  useEffect(() => {
    if (!isEmpty(createWatcherData)) {
      const taskSlug = createWatcherData?.insert_watcher?.returning[0]?.company_task?.task_slug

      notification.success({
        key: `create_success_key_${taskSlug}`,
        message: 'You have subscribed!',
        description: (
          <Typography>
            You will now receive emails on <span style={{ fontWeight: 'bold' }}>{startCase(taskSlug)}</span> failure.
          </Typography>
        ),
        placement: 'topRight',
        duration: 3,
      })

      if (refetchWatchers) {
        refetchWatchers({ user_id: user?.id })
      }
    }
  }, [createWatcherData, refetchWatchers, user])
  useEffect(() => {
    if (!isEmpty(deleteWatcherData)) {
      const taskSlug = deleteWatcherData?.delete_watcher?.returning[0]?.company_task?.task_slug

      notification.info({
        key: `delete_success_key_${taskSlug}`,
        message: 'You have unsubscribed.',
        description: (
          <Typography>
            You will no longer receive emails on <span style={{ fontWeight: 'bold' }}>{startCase(taskSlug)}</span>{' '}
            failure.
          </Typography>
        ),
        placement: 'topRight',
        duration: 3,
      })

      if (refetchWatchers) {
        refetchWatchers({ user_id: user?.id })
      }
    }
  }, [deleteWatcherData, refetchWatchers, user])

  // error creating/deleting watcher notifications
  useEffect(() => {
    if (createWatcherError) {
      notification.error({
        key: 'create_error_key',
        message: 'Error: Add Subscription',
        description: createWatcherError?.message,
        placement: 'topRight',
      })
    }
  }, [createWatcherError, notification])

  useEffect(() => {
    if (!isEmpty(deleteWatcherError)) {
      notification.error({
        key: 'delete_error_key',
        message: 'Error: Delete Subscription',
        description: deleteWatcherError?.message,
        placement: 'topRight',
      })
    }
  }, [deleteWatcherError, notification])

  const timezone = plotTime === 'user_time' ? getLocalTimezone() : company?.timezone
  const duration = getFormattedTimeDiff({ startTime: startedAt, endTime: completedAt })
  const supportWidgetText = makeTaskOrExecutionSupportDescription(id, type, honeycombLinks)

  const lastExecution = type === 'execution' ? execution : task?.executions && task.executions[0]

  return (
    <Box>
      <table>
        <tbody>
          <tr>
            <StyledTableData>ID</StyledTableData> <StyledTableData>{id}</StyledTableData>
          </tr>
          <tr>
            <StyledTableData>Started</StyledTableData>{' '}
            <StyledTableData>
              {formatTimeStamp(startedAt, timezone)} ({timeFromNow(startedAt, timezone)})
            </StyledTableData>
          </tr>
          <tr>
            <StyledTableData>Completed</StyledTableData>{' '}
            <StyledTableData>
              {status === 'running'
                ? 'Currently running'
                : `${formatTimeStamp(completedAt, timezone)} (${timeFromNow(completedAt, timezone)})`}
            </StyledTableData>
          </tr>
          <tr>
            <StyledTableBottomData>Duration</StyledTableBottomData>
            <StyledTableBottomData>
              {status === 'running' ? ' Currently running' : ` ${duration}`}
            </StyledTableBottomData>
          </tr>
        </tbody>
      </table>
      {isSuperAdmin && !isEmpty(honeycombLinks) && (
        <Flex alignItems="center">
          <Typography mr={1} type="body100">
            Honeycomb Links:
          </Typography>
          {map(honeycombLinks, (link) => (
            <Box key={link?.link} mr={1}>
              <a href={link?.link} target="_blank" rel="noopener noreferrer">
                {link?.name}
              </a>
            </Box>
          ))}
        </Flex>
      )}

      {task?.category === TASK_CATEGORY_PROCESSING && lastExecution?.status === 'failed' && (
        <Box mt={2}>
          <JobExecutionErrors taskExecutionId={lastExecution?.id} />
        </Box>
      )}

      <Flex mt={2} justifyContent="space-between">
        {status === 'failed' && (
          <Button
            type="link"
            icon={<MessageOutlined />}
            onClick={() => {
              prefillDescriptionSupport(supportWidgetText)
            }}
          >
            Chat with us
          </Button>
        )}

        <Button
          type="link"
          icon={<BellOutlined />}
          onClick={() => (isSubscribed ? deleteCompanyTaskWatcherMutation() : createCompanyTaskWatcherMutation())}
        >
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'} to Task Failure Emails
        </Button>
      </Flex>
    </Box>
  )
}

export default TaskOrExecutionTable
